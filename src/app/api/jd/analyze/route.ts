import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { JobDescriptionAnalyzer } from '@/lib/ai/jd-analyzer';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

const analyzeJDSchema = z.object({
  resumeId: z.string().uuid(),
  jobDescription: z.string().min(100, 'Job description must be at least 100 characters'),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  location: z.string().optional(),
});

/**
 * POST /api/jd/analyze
 * Analyze a job description and calculate ATS score for a resume
 */
async function handleAnalyzeJD(request: NextRequest, { user }: { user: any }) {
  try {
    const body = await request.json();

    // Validate input
    const validation = analyzeJDSchema.safeParse(body);
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

    const { resumeId, jobDescription, jobTitle, companyName, location } = validation.data;

    // Verify resume ownership
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      select: {
        id: true,
        userId: true,
        personalInfo: true,
        summary: true,
        experience: true,
        education: true,
        skills: true,
        certifications: true,
        projects: true,
        languages: true,
      },
    });

    if (!resume) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RESUME_NOT_FOUND',
            message: 'Resume not found',
          },
        },
        { status: 404 }
      );
    }

    if (resume.userId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have access to this resume',
          },
        },
        { status: 403 }
      );
    }

    // Check AI usage limits for free tier
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        planType: true,
        aiUsage: {
          where: {
            type: 'JD_MATCHING',
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)), // Today
            },
          },
        },
      },
    });

    if (currentUser?.planType === 'FREE' && currentUser.aiUsage.length >= 3) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LIMIT_EXCEEDED',
            message: 'Daily JD analysis limit reached for free plan. Upgrade to continue.',
            limit: 3,
            used: currentUser.aiUsage.length,
          },
        },
        { status: 429 }
      );
    }

    console.log('🔍 Analyzing job description...');

    // Step 1: Analyze the job description using AI
    const jdAnalysis = await JobDescriptionAnalyzer.analyzeJobDescription(jobDescription);

    console.log('📊 Calculating ATS score...');

    // Step 2: Calculate ATS score for current resume
    const atsScore = await JobDescriptionAnalyzer.calculateATSScore(resume, jdAnalysis);

    console.log('💾 Saving analysis...');

    // Step 3: Save analysis to database (save ALL extracted fields for auto-enhance)
    const savedAnalysis = await prisma.jobDescriptionAnalysis.create({
      data: {
        userId: user.id,
        resumeId: resumeId,
        jdText: jobDescription,
        jdTitle: jobTitle || jdAnalysis.jobTitle,
        jdCompany: companyName || jdAnalysis.companyName,
        jdLocation: location || jdAnalysis.location,
        keywords: jdAnalysis.keywords,
        requiredSkills: jdAnalysis.requiredSkills,
        preferredSkills: jdAnalysis.preferredSkills || [],
        tools: jdAnalysis.tools || [],
        certifications: jdAnalysis.certifications || [],
        education: jdAnalysis.education || [],
        experienceYears: jdAnalysis.experienceYears,
        mustHave: jdAnalysis.mustHave || [],
        niceToHave: jdAnalysis.niceToHave || [],
        atsScore: atsScore.overall,
        atsBreakdown: atsScore.breakdown,
        matchedKeywords: atsScore.matchedKeywords,
        missingKeywords: atsScore.missingKeywords,
        suggestions: atsScore.suggestions,
      },
    });

    // Update resume with latest analysis
    await prisma.resume.update({
      where: { id: resumeId },
      data: {
        lastJDAnalysis: savedAnalysis.id,
        atsScore: atsScore.overall,
      },
    });

    // Track AI usage
    await prisma.aIUsage.create({
      data: {
        userId: user.id,
        type: 'JD_MATCHING',
        tokensUsed: 0, // Will be tracked separately if needed
        cost: 0,
        requestData: {
          resumeId,
          jdLength: jobDescription.length,
        },
        responseData: {
          analysisId: savedAnalysis.id,
          atsScore: atsScore.overall,
        },
        successful: true,
      },
    });

    console.log('✅ Analysis complete!');

    return NextResponse.json({
      success: true,
      data: {
        analysisId: savedAnalysis.id,
        jdAnalysis: {
          jobTitle: jdAnalysis.jobTitle,
          requiredSkills: jdAnalysis.requiredSkills,
          preferredSkills: jdAnalysis.preferredSkills,
          keywords: jdAnalysis.keywords,
          tools: jdAnalysis.tools,
          certifications: jdAnalysis.certifications,
          experienceYears: jdAnalysis.experienceYears,
          mustHave: jdAnalysis.mustHave,
          niceToHave: jdAnalysis.niceToHave,
        },
        atsScore: {
          overall: atsScore.overall,
          breakdown: atsScore.breakdown,
          matchedKeywords: atsScore.matchedKeywords,
          missingKeywords: atsScore.missingKeywords,
          suggestions: atsScore.suggestions,
        },
      },
    });
  } catch (error) {
    console.error('❌ JD Analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ANALYSIS_FAILED',
          message: error instanceof Error ? error.message : 'Failed to analyze job description',
        },
      },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handleAnalyzeJD);
