import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { OpenAIService } from '@/lib/ai/openai';
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

    // Check plan limits
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        planType: true,
        aiUsage: {
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)), // Today
            },
          },
          select: { id: true },
        },
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        },
        { status: 404 }
      );
    }

    const dailyUsage = currentUser.aiUsage.length;

    // Check limits (FREE: 5/day, TIER1: 50/day, TIER2: unlimited)
    if (currentUser.planType === 'FREE' && dailyUsage >= 5) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LIMIT_REACHED',
            message: 'Free plan allows 5 AI generations per day. Please upgrade for more.',
          },
        },
        { status: 403 }
      );
    }

    if (currentUser.planType === 'TIER1' && dailyUsage >= 50) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LIMIT_REACHED',
            message: 'You have reached your daily limit of 50 AI generations.',
          },
        },
        { status: 403 }
      );
    }

    // Generate summary
    const summary = await OpenAIService.generateSummary({
      yearsOfExperience: yearsOfExperience || experience || '0',
      skills: skills || [],
      targetRole,
    });

    // Log AI usage
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
