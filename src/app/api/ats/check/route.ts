import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { ATSCheckerService } from '@/lib/ai/ats-checker';
import prisma from '@/lib/db/prisma';

/**
 * API endpoint to analyze resume for ATS compatibility
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
    const { resumeId, jobDescription } = body;

    if (!resumeId || typeof resumeId !== 'string') {
      return NextResponse.json(
        { error: 'resumeId is required and must be a string' },
        { status: 400 }
      );
    }

    if (!jobDescription || typeof jobDescription !== 'string') {
      return NextResponse.json(
        { error: 'jobDescription is required and must be a string' },
        { status: 400 }
      );
    }

    // Fetch resume from database
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Verify ownership
    if (resume.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse resume data
    const experience = (resume.experience as any) || [];
    const skills = (resume.skills as any) || [];
    const education = (resume.education as any) || [];

    const resumeContent = {
      summary: resume.summary || '',
      experience: Array.isArray(experience) ? experience : [],
      skills: Array.isArray(skills) ? skills : [],
      education: Array.isArray(education) ? education : [],
    };

    // Analyze ATS compatibility
    const analysis = ATSCheckerService.analyzeMatch(
      resumeContent,
      jobDescription
    );

    // Store the analysis result in database
    await prisma.resume.update({
      where: { id: resumeId },
      data: {
        lastJDAnalysis: analysis as any,
        atsScore: analysis.score,
      },
    });

    return NextResponse.json(analysis, { status: 200 });
  } catch (error) {
    console.error('ATS check API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze resume',
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
