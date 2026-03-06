import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { AIEnhancementService } from '@/lib/ai/enhancement-service';

/**
 * API endpoint to suggest skills based on job description
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

    // Call AI service
    const result = await AIEnhancementService.suggestSkills(
      currentSkills,
      jobDescription
    );

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

export const POST = withAuth((request: NextRequest, context: { user: any; params?: any }) => 
  handler(request, context)
);
export const dynamic = 'force-dynamic';
