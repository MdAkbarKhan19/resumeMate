import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { AIEnhancementService } from '@/lib/ai/enhancement-service';

/**
 * API endpoint to generate or improve professional summary
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
    const { resumeData } = body;

    if (!resumeData || typeof resumeData !== 'object') {
      return NextResponse.json(
        { error: 'resumeData is required and must be an object' },
        { status: 400 }
      );
    }

    // Call AI service
    const result = await AIEnhancementService.generateSummary(resumeData);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Generate summary API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate summary',
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
