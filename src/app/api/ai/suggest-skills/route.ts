import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { AIEnhancementService } from '@/lib/ai/enhancement-service';
import { canEnhanceBullet } from '@/lib/payment/entitlements';
import prisma from '@/lib/db/prisma';

/**
 * Suggest additional skills based on a job description.
 * Counts against the daily bullet-quota bucket.
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
    const { currentSkills, jobDescription } = body;

    if (!Array.isArray(currentSkills)) {
      return NextResponse.json(
        { error: 'currentSkills must be an array' },
        { status: 400 }
      );
    }
    if (!jobDescription || typeof jobDescription !== 'string') {
      return NextResponse.json(
        { error: 'jobDescription is required and must be a string' },
        { status: 400 }
      );
    }

    const gate = await canEnhanceBullet(userId);
    if (!gate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: gate.code || 'LIMIT_REACHED',
            message: gate.reason || 'Daily AI limit reached on your current plan.',
            tier: gate.tier,
            used: gate.used,
            limit: gate.limit,
            resetsAt: gate.resetsAt?.toISOString(),
          },
        },
        { status: 429 },
      );
    }

    const result = await AIEnhancementService.suggestSkills(currentSkills, jobDescription);

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
    console.error('Suggest skills API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to suggest skills',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
export const dynamic = 'force-dynamic';
