import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { OpenAIService } from '@/lib/ai/openai';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

const grammarCheckSchema = z.object({
  text: z.string().min(1, 'Text is required'),
});

async function handleGrammarCheck(request: NextRequest, { user }: { user: any }) {
  try {
    const body = await request.json();

    // Validate input
    const validation = grammarCheckSchema.safeParse(body);
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

    const { text } = validation.data;

    // Check plan limits
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        planType: true,
        aiUsage: {
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
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

    if (currentUser.planType === 'FREE' && dailyUsage >= 5) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LIMIT_REACHED',
            message: 'Free plan allows 5 AI operations per day. Please upgrade for more.',
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
            message: 'You have reached your daily limit of 50 AI operations.',
          },
        },
        { status: 403 }
      );
    }

    // Check grammar
    const result = await OpenAIService.checkGrammar(text);

    // Log AI usage
    await prisma.aIUsage.create({
      data: {
        userId: user.id,
        type: 'GRAMMAR_CHECK',
        tokensUsed: result.tokensUsed || 0,
        cost: result.cost || 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        original: text,
        corrected: result.corrected,
        corrections: result.corrections,
        tokensUsed: result.tokensUsed,
      },
    });
  } catch (error) {
    console.error('Grammar check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to check grammar',
        },
      },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handleGrammarCheck);
