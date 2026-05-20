/**
 * Plan entitlements + enforcement.
 *
 * Single source of truth for what each plan can do. Both API routes and the
 * frontend read from here so feature gates can never drift between client
 * and server.
 *
 * Plan summary:
 *   FREE   → 1 resume, 3 ATS optimizations / month, 10 bullet AI / day, watermarked downloads
 *   PACK   → 1 resume (per pack purchase), 5 ATS optimizations (per pack), unlimited bullet AI, no watermark
 *   PRO    → unlimited everything, no watermark
 */

import prisma from '@/lib/db/prisma';
import type { PlanType } from '@prisma/client';

export type EntitlementTier = 'free' | 'pack' | 'pro';

export interface PlanEntitlements {
  tier: EntitlementTier;
  maxActiveResumes: number | 'unlimited';
  ats: {
    period: 'monthly' | 'per_pack' | 'unlimited';
    limit: number; // ignored when period === 'unlimited'
  };
  bullets: {
    period: 'daily' | 'unlimited';
    limit: number; // ignored when period === 'unlimited'
  };
  /** Free downloads carry a tiled watermark; paid tiers do not. */
  watermark: boolean;
}

const FREE: PlanEntitlements = {
  tier: 'free',
  maxActiveResumes: 1,
  ats: { period: 'monthly', limit: 3 },
  bullets: { period: 'daily', limit: 10 },
  watermark: true,
};

const PACK: PlanEntitlements = {
  tier: 'pack',
  maxActiveResumes: 1,                     // a pack = 1 polished resume
  ats: { period: 'per_pack', limit: 5 },   // tracked since the most recent pack purchase
  bullets: { period: 'unlimited', limit: 0 },
  watermark: false,
};

const PRO: PlanEntitlements = {
  tier: 'pro',
  maxActiveResumes: 'unlimited',
  ats: { period: 'unlimited', limit: 0 },
  bullets: { period: 'unlimited', limit: 0 },
  watermark: false,
};

/**
 * Resolve which entitlement tier this user currently belongs to.
 *
 * Subscription expiry: if `subscriptionExpiry` has passed we silently
 * treat the user as Free regardless of the DB column (the webhook may
 * not have fired yet). The next webhook will reconcile.
 */
function tierForUser(user: {
  planType: PlanType;
  resumeCredits: number;
  subscriptionActive: boolean;
  subscriptionExpiry: Date | null;
}): EntitlementTier {
  // Active Pro subscription wins regardless of credits balance.
  if (user.planType === 'TIER2') {
    const stillActive =
      user.subscriptionActive &&
      (!user.subscriptionExpiry || user.subscriptionExpiry.getTime() > Date.now());
    if (stillActive) return 'pro';
  }
  // Pack tier: TIER1 with credits available since the latest pack purchase.
  if (user.planType === 'TIER1' && user.resumeCredits > 0) {
    return 'pack';
  }
  return 'free';
}

export async function getEntitlementsForUserId(userId: string): Promise<{
  user: {
    id: string;
    planType: PlanType;
    resumeCredits: number;
    subscriptionActive: boolean;
    subscriptionExpiry: Date | null;
  };
  entitlements: PlanEntitlements;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      planType: true,
      resumeCredits: true,
      subscriptionActive: true,
      subscriptionExpiry: true,
    },
  });
  if (!user) throw new Error('User not found');
  const tier = tierForUser(user);
  return { user, entitlements: tier === 'pro' ? PRO : tier === 'pack' ? PACK : FREE };
}

// ---------------------------------------------------------------------------
// Usage windows — when did the current quota period start?
// ---------------------------------------------------------------------------

function startOfMonth(d: Date = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function startOfDay(d: Date = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/**
 * For pack tier, the ATS window starts when the user purchased their most
 * recent pack. Scans done before that don't count against the new pack.
 */
async function packAtsWindowStart(userId: string): Promise<Date> {
  const latest = await prisma.payment.findFirst({
    where: { userId, status: 'COMPLETED', planType: 'TIER1' },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  return latest?.createdAt ?? new Date(0);
}

// ---------------------------------------------------------------------------
// Gate checks — call these at the top of every gated endpoint.
// Each returns a structured result; the API turns it into a 403/429 response.
// ---------------------------------------------------------------------------

export interface GateResult {
  allowed: boolean;
  reason?: string;
  code?: string;
  /** Current usage in the active window (for UI display + error messages). */
  used?: number;
  /** The quota limit (0 / Infinity means unlimited). */
  limit?: number;
  /** When the user's window resets (monthly / daily). Omitted for unlimited. */
  resetsAt?: Date;
  /** Tier resolved for this user — handy for logging/analytics. */
  tier: EntitlementTier;
}

export async function canCreateResume(userId: string): Promise<GateResult> {
  const { entitlements } = await getEntitlementsForUserId(userId);
  if (entitlements.maxActiveResumes === 'unlimited') {
    return { allowed: true, tier: entitlements.tier };
  }
  const activeResumeCount = await prisma.resume.count({ where: { userId } });
  if (activeResumeCount >= entitlements.maxActiveResumes) {
    return {
      allowed: false,
      tier: entitlements.tier,
      code: 'RESUME_LIMIT_REACHED',
      reason: `${entitlements.tier === 'free' ? 'Free' : 'Pack'} plan includes ${entitlements.maxActiveResumes} active resume. Upgrade to Pro for unlimited resumes.`,
      used: activeResumeCount,
      limit: entitlements.maxActiveResumes,
    };
  }
  return {
    allowed: true,
    tier: entitlements.tier,
    used: activeResumeCount,
    limit: entitlements.maxActiveResumes,
  };
}

export async function canRunAtsOptimization(userId: string): Promise<GateResult> {
  const { entitlements } = await getEntitlementsForUserId(userId);
  const { period, limit } = entitlements.ats;

  if (period === 'unlimited') return { allowed: true, tier: entitlements.tier };

  let windowStart: Date;
  let resetsAt: Date | undefined;
  if (period === 'monthly') {
    windowStart = startOfMonth();
    resetsAt = new Date(windowStart);
    resetsAt.setMonth(resetsAt.getMonth() + 1);
  } else {
    // per_pack: count since the latest pack purchase
    windowStart = await packAtsWindowStart(userId);
  }

  const used = await prisma.aIUsage.count({
    where: {
      userId,
      type: { in: ['AUTO_ENHANCEMENT', 'JD_MATCHING'] },
      createdAt: { gte: windowStart },
    },
  });

  if (used >= limit) {
    const msg =
      period === 'monthly'
        ? `Free plan includes ${limit} ATS optimizations / month (used ${used}). Resets on the 1st.`
        : `Pack includes ${limit} ATS optimizations (used ${used}). Buy another pack or upgrade to Pro for unlimited.`;
    return {
      allowed: false,
      tier: entitlements.tier,
      code: 'ATS_LIMIT_REACHED',
      reason: msg,
      used,
      limit,
      resetsAt,
    };
  }
  return { allowed: true, tier: entitlements.tier, used, limit, resetsAt };
}

export async function canEnhanceBullet(userId: string): Promise<GateResult> {
  const { entitlements } = await getEntitlementsForUserId(userId);
  const { period, limit } = entitlements.bullets;

  if (period === 'unlimited') return { allowed: true, tier: entitlements.tier };

  // period === 'daily'
  const windowStart = startOfDay();
  const resetsAt = new Date(windowStart);
  resetsAt.setDate(resetsAt.getDate() + 1);

  // All "small AI helper" actions share one daily quota for free users.
  // This prevents abuse where someone hits 10x enhance + 10x summary + 10x grammar.
  const used = await prisma.aIUsage.count({
    where: {
      userId,
      type: { in: ['BULLET_ENHANCEMENT', 'SUMMARY_GENERATION', 'GRAMMAR_CHECK', 'REDUNDANCY_CHECK'] },
      createdAt: { gte: windowStart },
    },
  });

  if (used >= limit) {
    return {
      allowed: false,
      tier: entitlements.tier,
      code: 'BULLET_LIMIT_REACHED',
      reason: `Free plan includes ${limit} AI bullet enhancements / day (used ${used}). Resets at midnight.`,
      used,
      limit,
      resetsAt,
    };
  }
  return { allowed: true, tier: entitlements.tier, used, limit, resetsAt };
}

/** Should this download be watermarked? Pulls fresh entitlements. */
export async function shouldWatermark(userId: string): Promise<boolean> {
  try {
    const { entitlements } = await getEntitlementsForUserId(userId);
    return entitlements.watermark;
  } catch {
    // If anything goes wrong, watermark by default — fail-closed is safer
    // than silently giving a free user a clean download.
    return true;
  }
}
