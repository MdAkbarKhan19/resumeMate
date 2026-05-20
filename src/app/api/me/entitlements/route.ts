import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import {
  getEntitlementsForUserId,
  canCreateResume,
  canRunAtsOptimization,
  canEnhanceBullet,
  shouldWatermark,
} from '@/lib/payment/entitlements';

/**
 * GET /api/me/entitlements
 *
 * One-shot snapshot of:
 *   1. The user's resolved entitlement tier (free / pack / pro)
 *   2. Live usage + limits for each gated action
 *   3. Whether downloads will be watermarked
 *
 * The builder calls this on mount + after any successful AI action so the UI
 * can show usage chips and pre-emptively disable upgrade-required buttons
 * without waiting for a 429 from the server.
 */
async function handleGetEntitlements(
  _request: NextRequest,
  { user }: { user: any },
) {
  try {
    const { entitlements } = await getEntitlementsForUserId(user.id);

    // Fan out the three gate checks in parallel.
    const [resumeGate, atsGate, bulletGate, watermark] = await Promise.all([
      canCreateResume(user.id),
      canRunAtsOptimization(user.id),
      canEnhanceBullet(user.id),
      shouldWatermark(user.id),
    ]);

    const usageRecord = (g: typeof resumeGate) => ({
      allowed: g.allowed,
      used: g.used ?? 0,
      limit: g.limit ?? null,           // null means unlimited
      resetsAt: g.resetsAt?.toISOString() ?? null,
      reason: g.reason ?? null,
    });

    return NextResponse.json({
      success: true,
      data: {
        tier: entitlements.tier,                       // 'free' | 'pack' | 'pro'
        watermark,                                     // boolean
        maxActiveResumes: entitlements.maxActiveResumes, // number | 'unlimited'
        ats: {
          period: entitlements.ats.period,
          ...usageRecord(atsGate),
        },
        bullets: {
          period: entitlements.bullets.period,
          ...usageRecord(bulletGate),
        },
        resumes: {
          ...usageRecord(resumeGate),
        },
      },
    });
  } catch (error) {
    console.error('Get entitlements error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to load entitlements' },
      },
      { status: 500 },
    );
  }
}

export const GET = withAuth(handleGetEntitlements);
