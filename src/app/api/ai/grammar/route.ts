import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { OpenAIService } from '@/lib/ai/openai';
import { canEnhanceBullet } from '@/lib/payment/entitlements';
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

    // Grammar check counts against the daily bullet-quota bucket.
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
