import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { AIAutoEnhancer } from '@/lib/ai/auto-enhancer';
import { JobDescriptionAnalyzer } from '@/lib/ai/jd-analyzer';
import { ATSCheckerService } from '@/lib/ai/ats-checker';
import { canRunAtsOptimization } from '@/lib/payment/entitlements';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

const autoEnhanceSchema = z.object({
  resumeId: z.string().uuid(),
  jdAnalysisId: z.string().uuid(),
});

/**
 * POST /api/ai/auto-enhance
 * Automatically enhance resume based on job description analysis
 */
async function handleAutoEnhance(request: NextRequest, { user }: { user: any }) {
  try {
    const body = await request.json();

    // Validate input
    const validation = autoEnhanceSchema.safeParse(body);
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

    const { resumeId, jdAnalysisId } = validation.data;

    // Fetch resume
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume || resume.userId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RESUME_NOT_FOUND',
            message: 'Resume not found or access denied',
          },
        },
        { status: 404 }
      );
    }

    // Fetch JD analysis
    const jdAnalysis = await prisma.jobDescriptionAnalysis.findUnique({
      where: { id: jdAnalysisId },
    });

    if (!jdAnalysis || jdAnalysis.userId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ANALYSIS_NOT_FOUND',
            message: 'Job description analysis not found or access denied',
          },
        },
        { status: 404 }
      );
    }

    // Enforce per-plan ATS quota.
    //   Free → 1 / month, Pack → 3 per pack, Pro → unlimited.
    // The check counts AIUsage rows of type AUTO_ENHANCEMENT / JD_MATCHING
    // within the user's active window.
    const gate = await canRunAtsOptimization(user.id);
    if (!gate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: gate.code || 'LIMIT_EXCEEDED',
            message: gate.reason || 'ATS optimization limit reached on your current plan.',
            tier: gate.tier,
            used: gate.used,
            limit: gate.limit,
            resetsAt: gate.resetsAt?.toISOString(),
          },
        },
        { status: 429 },
      );
    }

    console.log('🤖 Starting AI auto-enhancement...');

    // Helper to safely parse JSON arrays from DB
    const parseJsonArray = (val: any): string[] => {
      if (Array.isArray(val)) return val as string[];
      if (val && typeof val === 'string') {
        try { return JSON.parse(val); } catch { return []; }
      }
      return [];
    };

    // Extract action verbs from raw JD text (not stored in DB)
    const traditionalExtraction = ATSCheckerService.extractKeywords(jdAnalysis.jdText);

    // Reconstruct FULL JD analysis data from ALL stored DB fields
    const jdAnalysisData = {
      jobTitle: jdAnalysis.jdTitle || 'Unknown Position',
      requiredSkills: parseJsonArray(jdAnalysis.requiredSkills),
      preferredSkills: parseJsonArray(jdAnalysis.preferredSkills),
      keywords: parseJsonArray(jdAnalysis.keywords),
      actionVerbs: traditionalExtraction.actionVerbs,
      tools: parseJsonArray(jdAnalysis.tools),
      certifications: parseJsonArray(jdAnalysis.certifications),
      education: parseJsonArray(jdAnalysis.education),
      experienceYears: jdAnalysis.experienceYears || undefined,
      responsibilities: [],
      qualifications: [],
      mustHave: parseJsonArray(jdAnalysis.mustHave),
      niceToHave: parseJsonArray(jdAnalysis.niceToHave),
      companyName: jdAnalysis.jdCompany || undefined,
      matchedKeywords: parseJsonArray(jdAnalysis.matchedKeywords),
      missingKeywords: parseJsonArray(jdAnalysis.missingKeywords),
    };

    // Calculate BEFORE score
    const beforeScore = await JobDescriptionAnalyzer.calculateATSScore(
      resume,
      jdAnalysisData
    );

    console.log(`📊 Before Score: ${beforeScore.overall}/100`);

    // Perform auto-enhancement
    const enhancementResult = await AIAutoEnhancer.autoEnhanceResume(
      resume,
      jdAnalysisData
    );

    console.log('✨ Enhancement complete:', enhancementResult.summary);

    // Calculate AFTER score
    const afterScore = await JobDescriptionAnalyzer.calculateATSScore(
      enhancementResult.enhancedResume,
      jdAnalysisData
    );

    console.log(`📊 After Score: ${afterScore.overall}/100 (Improvement: +${afterScore.overall - beforeScore.overall})`);

    // Compare scores
    const comparison = JobDescriptionAnalyzer.compareScores(beforeScore, afterScore);

    // Record one ATS optimization against the user's quota. The entitlements
    // module counts AUTO_ENHANCEMENT (and the legacy JD_MATCHING for old rows).
    await prisma.aIUsage.create({
      data: {
        userId: user.id,
        type: 'AUTO_ENHANCEMENT',
        tokensUsed: 0,
        cost: 0,
        requestData: {
          resumeId,
          jdAnalysisId,
        },
        responseData: {
          beforeScore: beforeScore.overall,
          afterScore: afterScore.overall,
          improvement: comparison.improvement,
          changes: enhancementResult.changes.length,
        },
        successful: true,
      },
    });

    console.log('✅ Auto-enhancement complete!');

    return NextResponse.json({
      success: true,
      data: {
        enhancedResume: enhancementResult.enhancedResume,
        changes: enhancementResult.changes,
        summary: enhancementResult.summary,
        scores: {
          before: beforeScore,
          after: afterScore,
          improvement: comparison.improvement,
          keyImprovements: comparison.keyImprovements,
        },
      },
    });
  } catch (error) {
    console.error('❌ Auto-enhancement error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ENHANCEMENT_FAILED',
          message: error instanceof Error ? error.message : 'Failed to enhance resume',
        },
      },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handleAutoEnhance);
