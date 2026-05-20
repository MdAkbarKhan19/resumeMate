import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { OpenAIService } from '@/lib/ai/openai';
import { ComprehendService } from '@/lib/aws/comprehend';
import { canRunAtsOptimization } from '@/lib/payment/entitlements';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const matchJobDescriptionSchema = z.object({
  resumeId: z.string().uuid(),
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
  jobTitle: z.string().min(1, 'Job title is required'),
  companyName: z.string().optional(),
});

async function handleMatchJob(request: NextRequest, { user }: { user: any }) {
  try {
    const body = await request.json();

    // Validate input
    const validation = matchJobDescriptionSchema.safeParse(body);
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

    const { resumeId, jobDescription, jobTitle, companyName } = validation.data;

    // Check resume exists and ownership
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

    // JD matching is an ATS optimization — counts against the user's ATS quota.
    const atsGate = await canRunAtsOptimization(user.id);
    if (!atsGate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: atsGate.code || 'LIMIT_REACHED',
            message: atsGate.reason || 'ATS optimization limit reached on your current plan.',
            tier: atsGate.tier,
            used: atsGate.used,
            limit: atsGate.limit,
            resetsAt: atsGate.resetsAt?.toISOString(),
          },
        },
        { status: 429 },
      );
    }

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

    // Convert resume to text
    const resumeText = `
      ${JSON.stringify(resume.personalInfo)}
      ${resume.summary || ''}
      ${JSON.stringify(resume.experience)}
      ${JSON.stringify(resume.education)}
      ${JSON.stringify(resume.skills)}
      ${JSON.stringify(resume.certifications)}
      ${JSON.stringify(resume.projects)}
    `.trim();

    // Analyze job description with AWS Comprehend
    const jdAnalysis = await ComprehendService.analyzeJobDescription(jobDescription);

    // Score resume against job description with OpenAI
    const matchResult = await OpenAIService.scoreResumeMatch(resumeText, jobDescription);

    // Save analysis
    const analysis = await prisma.jobDescriptionAnalysis.create({
      data: {
        userId: user.id,
        resumeId: resume.id,
        jdText: jobDescription,
        jdTitle: jobTitle,
        jdCompany: companyName,
        atsScore: matchResult.score,
        keywords: (matchResult.strengths || []) as Prisma.JsonArray,
        requiredSkills: [] as Prisma.JsonArray,
        matchedKeywords: (matchResult.strengths || []) as Prisma.JsonArray,
        missingKeywords: (matchResult.gaps || []) as Prisma.JsonArray,
        suggestions: (matchResult.recommendations || []) as Prisma.JsonArray,
      },
    });

    // Log AI usage
    await prisma.aIUsage.create({
      data: {
        userId: user.id,
        type: 'JD_MATCHING',
        tokensUsed: 0,
        cost: 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        analysisId: analysis.id,
        matchScore: matchResult.score,
        strengths: matchResult.strengths,
        gaps: matchResult.gaps,
        recommendations: matchResult.recommendations,
        keywords: jdAnalysis.keywords,
        entities: jdAnalysis.entities,
      },
    });
  } catch (error) {
    console.error('Job match error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to analyze job match',
        },
      },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handleMatchJob);
