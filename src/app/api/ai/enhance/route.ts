import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { OpenAIService } from '@/lib/ai/openai';
import { canEnhanceBullet } from '@/lib/payment/entitlements';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

const enhanceBulletSchema = z.object({
  bullet: z.string().min(5, 'Bullet point must be at least 5 characters'),
  context: z.string().optional(),
});

async function handleEnhance(request: NextRequest, { user }: { user: any }) {
  try {
    const body = await request.json();

    // Validate input
    const validation = enhanceBulletSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { bullet, context } = validation.data;

    // Enforce per-plan AI bullet quota via the central entitlements module.
    //   Free → 10 / day, Pack & Pro → unlimited.
    const gate = await canEnhanceBullet(user.id);
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

    // Enhance bullet point
    const enhanced = await OpenAIService.enhanceBullet(bullet, context);

    // Log AI usage
    await prisma.aIUsage.create({
      data: {
        userId: user.id,
        type: 'BULLET_ENHANCEMENT',
        tokensUsed: enhanced.tokensUsed || 0,
        cost: enhanced.cost || 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        original: bullet,
        enhanced: enhanced.enhanced,
        improvements: enhanced.improvements,
        tokensUsed: enhanced.tokensUsed,
      },
    });
  } catch (error) {
    console.error('Enhance bullet error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to enhance bullet point',
        },
      },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handleEnhance);
