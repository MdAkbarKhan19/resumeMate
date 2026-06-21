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
    // The auth middleware returns the DB user row (`user.id`), not a raw token
    // (`user.sub`). Accept both so ATS checks work for local-JWT and Cognito
    // sessions alike. Without the `.id` fallback this route 401'd every user.
    const userId = context.user?.sub || context.user?.id;

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

    // Skills are stored grouped as { category, items[] }, but the ATS matcher
    // expects a flat [{ name }] list. Flatten both shapes (and tolerate flat
    // {name}/{skill}/string entries) so keyword matching actually sees them.
    const rawSkills = Array.isArray(skills) ? skills : [];
    const normalizedSkills = rawSkills.flatMap((s: any) => {
      if (s && Array.isArray(s.items)) return s.items.map((name: string) => ({ name: String(name) }));
      if (s && Array.isArray(s.keywords)) return s.keywords.map((name: string) => ({ name: String(name) }));
      if (typeof s === 'string') return [{ name: s }];
      return [{ name: String(s?.name || s?.skill || '') }];
    }).filter((s: { name: string }) => s.name.trim().length > 0);

    const resumeContent = {
      summary: resume.summary || '',
      experience: Array.isArray(experience) ? experience : [],
      skills: normalizedSkills,
      education: Array.isArray(education) ? education : [],
    };

    // Analyze ATS compatibility
    const analysis = ATSCheckerService.analyzeMatch(
      resumeContent,
      jobDescription
    );

    // Persist the latest ATS score. NOTE: `lastJDAnalysis` is a String? column
    // (meant for an analysis id), so we must NOT shove the analysis object into
    // it — doing so threw a Prisma validation error and 500'd the request.
    await prisma.resume.update({
      where: { id: resumeId },
      data: {
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
