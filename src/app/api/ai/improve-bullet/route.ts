import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { AIEnhancementService } from '@/lib/ai/enhancement-service';

/**
 * API endpoint to improve resume bullet points using AI
 */
async function handler(
  request: NextRequest,
  context: { user: any }
): Promise<NextResponse> {
  try {
    const userId = context.user?.sub;

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

    // Call AI service
    const result = await AIEnhancementService.improveBullet(
      bulletText,
      bulletContext
    );

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

export const POST = withAuth((request: NextRequest, context: { user: any; params?: any }) => 
  handler(request, context)
);
export const dynamic = 'force-dynamic';
