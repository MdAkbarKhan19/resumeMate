import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { withAuth } from '@/lib/auth/middleware';
import { AIAutoEnhancer, type EnhanceMode } from '@/lib/ai/auto-enhancer';
import { JobDescriptionAnalyzer } from '@/lib/ai/jd-analyzer';
import { ATSCheckerService } from '@/lib/ai/ats-checker';
import { canRunAtsOptimization } from '@/lib/payment/entitlements';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

// Always run dynamically; never let Next try to cache/prerender this.
export const dynamic = 'force-dynamic';

const autoEnhanceSchema = z.object({
  resumeId: z.string().uuid(),
  jdAnalysisId: z.string().uuid(),
  // Bullet-tailoring strategy the user picked before running. Defaults to
  // 'aggressive' (max JD match) when omitted.
  mode: z.enum(['aggressive', 'moderate']).optional(),
});

/**
 * Async job model for auto-enhance.
 *
 * Why: the enhancement runs the believability-critical rewrite + reflection on
 * DeepSeek V4 Pro — a *reasoning* model that takes 60–150s for a full resume.
 * Doing that inside the HTTP request meant the nginx proxy gave up at 150s and
 * returned a 504 ("Gateway Time-out") even though the work eventually finished.
 *
 * Instead, POST starts the work in the background and returns a `jobId`
 * immediately; the client polls GET ?jobId until it's `done`. This removes the
 * proxy-timeout failure entirely WITHOUT changing the model, the accuracy, or
 * the per-run cost — the exact same calls just run off the request thread.
 *
 * Storage is an in-process Map (kept on globalThis so it survives module
 * re-evaluation). This is correct for the single-process PM2 deployment. Jobs
 * are best-effort: a process restart drops in-flight jobs and the client simply
 * retries. A 10-minute TTL reaps finished/abandoned jobs so memory can't grow.
 */
type JobStatus = 'processing' | 'done' | 'error';
interface EnhanceJob {
  status: JobStatus;
  userId: string;
  createdAt: number;
  result?: unknown;
  error?: { code: string; message: string };
}

const JOBS: Map<string, EnhanceJob> =
  (globalThis as any).__enhanceJobs ?? new Map<string, EnhanceJob>();
(globalThis as any).__enhanceJobs = JOBS;

const JOB_TTL_MS = 20 * 60 * 1000; // 20 min — comfortably beyond the client's poll window

function reapExpiredJobs() {
  const now = Date.now();
  for (const [id, job] of JOBS) {
    if (now - job.createdAt > JOB_TTL_MS) JOBS.delete(id);
  }
}

// Reap on a timer too (not only on POST) so a fully idle process still reclaims
// finished jobs. Installed once; unref'd so it never keeps the process alive.
if (!(globalThis as any).__enhanceReaper) {
  const t = setInterval(reapExpiredJobs, 60_000);
  (t as any).unref?.();
  (globalThis as any).__enhanceReaper = t;
}

/**
 * The heavy lifting, run OFF the request thread (fire-and-forget). On a
 * persistent Node server (`next start`) the event loop keeps executing this
 * after the HTTP response has been sent. Any error is captured into the job so
 * the client's poll surfaces it cleanly (never an unhandled rejection).
 */
async function runEnhancementJob(
  jobId: string,
  resume: any,
  jdAnalysisData: any,
  userId: string,
  resumeId: string,
  jdAnalysisId: string,
  mode: EnhanceMode,
): Promise<void> {
  try {
    console.log(`🤖 [${jobId}] Starting AI auto-enhancement...`);

    const beforeScore = await JobDescriptionAnalyzer.calculateATSScore(resume, jdAnalysisData);
    console.log(`📊 [${jobId}] Before Score: ${beforeScore.overall}/100`);

    const enhancementResult = await AIAutoEnhancer.autoEnhanceResume(resume, jdAnalysisData, mode);

    const afterScore = await JobDescriptionAnalyzer.calculateATSScore(
      enhancementResult.enhancedResume,
      jdAnalysisData,
    );
    const comparison = JobDescriptionAnalyzer.compareScores(beforeScore, afterScore);
    console.log(
      `📊 [${jobId}] After Score: ${afterScore.overall}/100 (Improvement: +${afterScore.overall - beforeScore.overall})`,
    );

    // Publish the result FIRST — it's what the client is waiting for. Quota
    // accounting is secondary and must never block delivery or, if the DB
    // stalls, leave the job wedged in 'processing' / cost the user their result.
    const job = JOBS.get(jobId);
    if (job) {
      job.status = 'done';
      job.result = {
        enhancedResume: enhancementResult.enhancedResume,
        changes: enhancementResult.changes,
        summary: enhancementResult.summary,
        scores: {
          before: beforeScore,
          after: afterScore,
          improvement: comparison.improvement,
          keyImprovements: comparison.keyImprovements,
        },
      };
    }
    console.log(
      `✨ [${jobId}] mode=${mode} | bullets:${enhancementResult.summary.bulletsModified} skills:${enhancementResult.summary.skillsAdded} summary:${enhancementResult.summary.summaryEnhanced}`,
    );
    console.log(`✅ [${jobId}] Auto-enhancement complete!`);

    // Record one ATS optimization against the user's quota (best-effort).
    try {
      await prisma.aIUsage.create({
        data: {
          userId,
          type: 'AUTO_ENHANCEMENT',
          tokensUsed: enhancementResult.usage.tokensUsed,
          cost: Number(enhancementResult.usage.cost.toFixed(6)),
          requestData: { resumeId, jdAnalysisId },
          responseData: {
            beforeScore: beforeScore.overall,
            afterScore: afterScore.overall,
            improvement: comparison.improvement,
            changes: enhancementResult.changes.length,
          },
          successful: true,
        },
      });
      console.log(
        `💰 [${jobId}] Enhancement cost: ~$${enhancementResult.usage.cost.toFixed(5)} (${enhancementResult.usage.tokensUsed} tokens)`,
      );
    } catch (usageErr) {
      console.error(`⚠️ [${jobId}] Failed to record AI usage (result already delivered):`, usageErr);
    }
  } catch (error) {
    console.error(`❌ [${jobId}] Auto-enhancement job error:`, error);
    const job = JOBS.get(jobId);
    if (job) {
      job.status = 'error';
      // Generic, user-safe message only — never leak SDK / Prisma / model details
      // (which could also surface the provider name in the UI).
      job.error = { code: 'ENHANCEMENT_FAILED', message: 'Enhancement failed. Please try again.' };
    }
  }
}

/**
 * POST /api/ai/auto-enhance
 * Validates + authorizes synchronously (fast), then kicks off the enhancement
 * as a background job and returns a jobId immediately (HTTP 202).
 */
async function handleStartEnhance(request: NextRequest, { user }: { user: any }) {
  try {
    const body = await request.json();

    const validation = autoEnhanceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: validation.error.errors },
        },
        { status: 400 },
      );
    }

    const { resumeId, jdAnalysisId } = validation.data;
    const mode: EnhanceMode = validation.data.mode || 'aggressive';

    const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume || resume.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'RESUME_NOT_FOUND', message: 'Resume not found or access denied' } },
        { status: 404 },
      );
    }

    const jdAnalysis = await prisma.jobDescriptionAnalysis.findUnique({ where: { id: jdAnalysisId } });
    if (!jdAnalysis || jdAnalysis.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'ANALYSIS_NOT_FOUND', message: 'Job description analysis not found or access denied' } },
        { status: 404 },
      );
    }

    // Enforce per-plan ATS quota up-front (Free → 1/month, Pack → 3, Pro → ∞).
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

    // Helper to safely parse JSON arrays from DB
    const parseJsonArray = (val: any): string[] => {
      if (Array.isArray(val)) return val as string[];
      if (val && typeof val === 'string') {
        try { return JSON.parse(val); } catch { return []; }
      }
      return [];
    };

    const traditionalExtraction = ATSCheckerService.extractKeywords(jdAnalysis.jdText);

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

    // One concurrent optimization per user. Closes the double-submit / parallel
    // request window where two POSTs both pass the read-only quota gate before
    // either records usage (TOCTOU), and stops a user/script from firing many
    // expensive jobs at once.
    for (const existing of JOBS.values()) {
      if (existing.userId === user.id && existing.status === 'processing') {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'ALREADY_RUNNING', message: 'An optimization is already running. Please wait for it to finish.' },
          },
          { status: 409 },
        );
      }
    }

    reapExpiredJobs();
    const jobId = randomUUID();
    JOBS.set(jobId, { status: 'processing', userId: user.id, createdAt: Date.now() });

    // Fire-and-forget. Intentionally NOT awaited — the response returns now and
    // the work continues on the event loop. Errors are captured inside the job.
    void runEnhancementJob(jobId, resume, jdAnalysisData, user.id, resumeId, jdAnalysisId, mode);

    return NextResponse.json({ success: true, data: { jobId, status: 'processing' } }, { status: 202 });
  } catch (error) {
    console.error('❌ Auto-enhance start error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'ENHANCEMENT_FAILED', message: 'Failed to start enhancement' } },
      { status: 500 },
    );
  }
}

/**
 * GET /api/ai/auto-enhance?jobId=...
 * Returns the status (and result, when done) of a background enhancement job.
 */
async function handleEnhanceStatus(request: NextRequest, { user }: { user: any }) {
  const jobId = new URL(request.url).searchParams.get('jobId');
  if (!jobId) {
    return NextResponse.json(
      { success: false, error: { code: 'MISSING_JOB_ID', message: 'jobId is required' } },
      { status: 400 },
    );
  }

  const job = JOBS.get(jobId);
  if (!job) {
    return NextResponse.json(
      { success: false, error: { code: 'JOB_NOT_FOUND', message: 'Enhancement job not found or expired. Please run it again.' } },
      { status: 404 },
    );
  }

  // Never let one user poll another user's job/result.
  if (job.userId !== user.id) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
      { status: 403 },
    );
  }

  if (job.status === 'processing') {
    return NextResponse.json({ success: true, data: { status: 'processing' } });
  }

  if (job.status === 'error') {
    // 200 (not 5xx): this is a terminal application state, not a server fault.
    // It also lets the client cleanly distinguish a real job failure (200 +
    // success:false) from a transient infra blip (non-200) during polling.
    return NextResponse.json(
      { success: false, error: job.error || { code: 'ENHANCEMENT_FAILED', message: 'Enhancement failed. Please try again.' } },
      { status: 200 },
    );
  }

  // done
  return NextResponse.json({ success: true, data: { status: 'done', result: job.result } });
}

export const POST = withAuth(handleStartEnhance);
export const GET = withAuth(handleEnhanceStatus);
