/**
 * Orchestrator API Endpoint
 * POST /api/agents/orchestrate
 * Handles all agentic AI operations with Server-Sent Events for progress updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { ResumeOrchestrator } from '@/lib/agents/orchestrator';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

const orchestrateSchema = z.object({
  action: z.enum(['parse-resume', 'analyze-jd', 'score-ats', 'enhance-resume', 'full-pipeline']),
  resumeId: z.string().uuid().optional(),
  jdText: z.string().optional(),
  targetScore: z.number().min(0).max(100).optional(),
  resumeText: z.string().optional(),
});

async function handleOrchestrate(request: NextRequest, { user }: { user: any }) {
  try {
    const body = await request.json();

    const validation = orchestrateSchema.safeParse(body);
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

    const { action, resumeId, jdText, targetScore, resumeText } = validation.data;

    // Load resume data if resumeId provided
    let resumeData = null;
    if (resumeId) {
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
          volunteer: true,
          customSections: true,
        },
      });

      if (!resume) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Resume not found' } },
          { status: 404 }
        );
      }

      if (resume.userId !== user.id) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
          { status: 403 }
        );
      }

      resumeData = resume;
    }

    // Check AI usage limits
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        planType: true,
        aiUsage: {
          where: {
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        },
      },
    });

    const dailyLimit = currentUser?.planType === 'FREE' ? 5 : currentUser?.planType === 'TIER1' ? 50 : Infinity;
    if (currentUser && currentUser.aiUsage.length >= dailyLimit) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LIMIT_EXCEEDED',
            message: 'Daily AI usage limit reached. Upgrade your plan for more.',
          },
        },
        { status: 429 }
      );
    }

    // Run orchestrator
    const progressLog: any[] = [];
    const orchestrator = new ResumeOrchestrator((progress) => {
      progressLog.push({ ...progress, timestamp: Date.now() });
    });

    let result: any;

    switch (action) {
      case 'analyze-jd': {
        if (!jdText) {
          return NextResponse.json(
            { success: false, error: { code: 'MISSING_JD', message: 'Job description text is required' } },
            { status: 400 }
          );
        }
        const jdAnalysis = await orchestrator.analyzeJD(jdText);

        // Also score if we have resume data
        if (resumeData) {
          const score = await orchestrator.scoreResume(resumeData as any, jdAnalysis);

          // Save analysis to DB
          const savedAnalysis = await prisma.jobDescriptionAnalysis.create({
            data: {
              userId: user.id,
              resumeId: resumeId!,
              jdText,
              jdTitle: jdAnalysis.jobTitle,
              jdCompany: jdAnalysis.companyName,
              keywords: jdAnalysis.keywords,
              requiredSkills: jdAnalysis.requiredSkills,
              atsScore: score.overall,
              missingKeywords: score.missingKeywords,
              suggestions: score.suggestions.map(s => s.message),
            },
          });

          result = { analysisId: savedAnalysis.id, jdAnalysis, atsScore: score };
        } else {
          result = { jdAnalysis };
        }
        break;
      }

      case 'score-ats': {
        if (!resumeData || !jdText) {
          return NextResponse.json(
            { success: false, error: { code: 'MISSING_DATA', message: 'Resume and JD text are required' } },
            { status: 400 }
          );
        }
        const jdAnalysis = await orchestrator.analyzeJD(jdText);
        result = await orchestrator.scoreResume(resumeData as any, jdAnalysis);
        break;
      }

      case 'enhance-resume': {
        if (!resumeData || !jdText) {
          return NextResponse.json(
            { success: false, error: { code: 'MISSING_DATA', message: 'Resume and JD text are required' } },
            { status: 400 }
          );
        }
        const jdAn = await orchestrator.analyzeJD(jdText);
        result = await orchestrator.enhanceResume(resumeData as any, jdAn, targetScore);
        break;
      }

      case 'full-pipeline': {
        if (!jdText) {
          return NextResponse.json(
            { success: false, error: { code: 'MISSING_JD', message: 'Job description text is required' } },
            { status: 400 }
          );
        }
        result = await orchestrator.fullPipeline({
          resumeData: resumeData as any,
          resumeText,
          jdText,
          targetScore,
        });
        break;
      }

      case 'parse-resume': {
        if (!resumeText) {
          return NextResponse.json(
            { success: false, error: { code: 'MISSING_TEXT', message: 'Resume text is required' } },
            { status: 400 }
          );
        }
        result = await orchestrator.parseResume(resumeText);
        break;
      }
    }

    // Track AI usage
    const usageTypeMap: Record<string, string> = {
      'parse-resume': 'RESUME_PARSING',
      'analyze-jd': 'JD_ANALYSIS',
      'score-ats': 'JD_MATCHING',
      'enhance-resume': 'AUTO_ENHANCEMENT',
      'full-pipeline': 'AUTO_ENHANCEMENT',
    };
    await prisma.aIUsage.create({
      data: {
        userId: user.id,
        type: (usageTypeMap[action] || 'AUTO_ENHANCEMENT') as any,
        tokensUsed: 0,
        cost: 0,
        requestData: { action, resumeId },
        responseData: { success: true },
        successful: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
      progress: progressLog,
    });
  } catch (error) {
    console.error('Orchestrator error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ORCHESTRATOR_ERROR',
          message: error instanceof Error ? error.message : 'Agent orchestration failed',
        },
      },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handleOrchestrate);
