import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { AIEnhancementService } from '@/lib/ai/enhancement-service';
import { canEnhanceBullet } from '@/lib/payment/entitlements';
import prisma from '@/lib/db/prisma';

/**
 * API endpoint to improve resume bullet points using AI.
 * Counts against the user's daily bullet-enhancement quota (10/day free).
 */
async function handler(
  request: NextRequest,
  { user }: { user: any }
): Promise<NextResponse> {
  try {
    // Bug fix: middleware returns `user.id`, not `user.sub`.
    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bulletText, context: bulletContext } = body;

    if (!bulletText || typeof bulletText !== 'string') {
      return NextResponse.json(
        { error: 'bulletText is required and must be a string' },
        { status: 400 }
      );
    }

    // Per-plan bullet quota.
    const gate = await canEnhanceBullet(userId);
    if (!gate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: gate.code || 'LIMIT_REACHED',
            message: gate.reason || 'AI enhancement limit reached on your current plan.',
            tier: gate.tier,
            used: gate.used,
            limit: gate.limit,
            resetsAt: gate.resetsAt?.toISOString(),
          },
        },
        { status: 429 },
      );
    }

    const result = await AIEnhancementService.improveBullet(bulletText, bulletContext);

    // Log usage so quota counts correctly.
    await prisma.aIUsage.create({
      data: {
        userId,
        type: 'BULLET_ENHANCEMENT',
        tokensUsed: 0,
        cost: 0,
      },
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Improve bullet API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to improve bullet point',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
