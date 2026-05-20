import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { OpenAIService } from '@/lib/ai/openai';
import { canEnhanceBullet } from '@/lib/payment/entitlements';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

const generateSummarySchema = z.object({
  experience: z.string().optional(),
  skills: z.array(z.string()).optional(),
  targetRole: z.string().optional(),
  yearsOfExperience: z.string().optional(),
});

async function handleGenerateSummary(request: NextRequest, { user }: { user: any }) {
  try {
    const body = await request.json();

    // Validate input
    const validation = generateSummarySchema.safeParse(body);
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

    const { experience, skills, targetRole, yearsOfExperience } = validation.data;

    // Summary generation is a small AI helper — counts against the daily bullet quota.
    // Free: 10/day across enhance + summary + grammar + skills + improve-bullet combined.
    const gate = await canEnhanceBullet(user.id);
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

    // Generate summary
    const summary = await OpenAIService.generateSummary({
      yearsOfExperience: yearsOfExperience || experience || '0',
      skills: skills || [],
      targetRole,
    });

    // Log AI usage. The gate above counts all small AI types together,
    // so logging with the correct type preserves analytics granularity.
    await prisma.aIUsage.create({
      data: {
        userId: user.id,
        type: 'SUMMARY_GENERATION',
        tokensUsed: summary.tokensUsed || 0,
        cost: summary.cost || 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: summary.summary,
        tokensUsed: summary.tokensUsed,
      },
    });
  } catch (error) {
    console.error('Generate summary error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate summary',
        },
      },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handleGenerateSummary);
