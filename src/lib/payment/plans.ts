/**
 * Single source of truth for all paid plans.
 *
 * The UI, the create-order/create-subscription endpoints, the verify
 * endpoint, and the webhook all read from this catalog so prices,
 * durations, and Razorpay plan IDs can never drift apart.
 *
 * Razorpay-side setup (one-time, in the Razorpay Dashboard):
 *   1. Create THREE recurring plans, each in INR, with `period` and
 *      `interval` matching the table below.
 *   2. Drop their IDs (start with `plan_`) into env vars:
 *        RAZORPAY_PRO_MONTHLY_PLAN_ID
 *        RAZORPAY_PRO_QUARTERLY_PLAN_ID
 *        RAZORPAY_PRO_ANNUAL_PLAN_ID
 *   3. The one-time pack does NOT need a Razorpay plan — we create
 *      a fresh Order each time via the Orders API.
 */

import type { PlanType } from '@prisma/client';

export type PlanKind = 'free' | 'one_time' | 'subscription';

export interface PlanCatalogEntry {
  /** Stable internal ID, used by the API + UI. Never change. */
  id: 'free' | 'pack' | 'pro_monthly' | 'pro_quarterly' | 'pro_annual';
  /** Human display name. */
  name: string;
  /** Short tagline shown under the price. */
  tagline: string;
  /** Long-form features list shown on the pricing card. */
  features: string[];
  /** What kind of Razorpay interaction this triggers. */
  kind: PlanKind;
  /** Price in paise (1 INR = 100 paise). 0 for the free tier. */
  amountPaise: number;
  /** Human-friendly amount shown on the card (INR, no symbol). */
  displayAmount: string;
  /** Cadence label shown after the price ("/month", "one-time", etc.). */
  cadence: string;
  /** Subscription-only: number of months one billing cycle covers. */
  cycleMonths?: 1 | 3 | 12;
  /** Subscription-only: how many cycles before subscription ends. We bill
   *  for one year regardless of cadence, so monthly=12, quarterly=4, annual=1. */
  totalCount?: number;
  /** Subscription-only: env var holding the Razorpay plan_ID. */
  razorpayPlanEnv?: string;
  /** One-time pack: how many resume credits to grant on success. */
  creditsGranted?: number;
  /** Which PlanType column to set on the User row when this plan is active.
   *  Free → FREE, pack → TIER1 (uses resumeCredits), all Pro tiers → TIER2. */
  userPlanType: PlanType;
  /** Stored on Payment.planDuration so reporting can tell tiers apart. */
  planDuration?: 'one-time' | 'monthly' | 'quarterly' | 'yearly';
  /** Marked as "Most Popular" badge on the pricing UI. */
  popular?: boolean;
  /** % saving vs the monthly Pro price, shown as a chip on the card. */
  savingsLabel?: string;
}

export const PLAN_CATALOG: Record<string, PlanCatalogEntry> = {
  free: {
    id: 'free',
    name: 'Free',
    tagline: 'Try the product end-to-end',
    features: [
      '1 active resume',
      '3 ATS optimizations / month',
      'PDF download (with watermark)',
      'Both templates',
    ],
    kind: 'free',
    amountPaise: 0,
    displayAmount: '0',
    cadence: 'forever',
    userPlanType: 'FREE' as PlanType,
  },

  pack: {
    id: 'pack',
    name: 'Single Resume Pack',
    tagline: 'For one specific job application',
    features: [
      '1 polished resume',
      '5 ATS optimizations',
      'Unlimited downloads for 30 days',
      'No watermark',
    ],
    kind: 'one_time',
    amountPaise: 14900, // ₹149
    displayAmount: '149',
    cadence: 'one-time',
    creditsGranted: 1,
    userPlanType: 'TIER1' as PlanType,
    planDuration: 'one-time',
  },

  pro_monthly: {
    id: 'pro_monthly',
    name: 'Pro Monthly',
    tagline: 'Cheaper than a coffee per day',
    features: [
      'Unlimited resumes & ATS optimizations',
      'All templates + advanced customization',
      'Auto-fit font sizing',
      'No watermark, priority rendering',
    ],
    kind: 'subscription',
    amountPaise: 29900, // ₹299
    displayAmount: '299',
    cadence: '/ month',
    cycleMonths: 1,
    totalCount: 12,
    razorpayPlanEnv: 'RAZORPAY_PRO_MONTHLY_PLAN_ID',
    userPlanType: 'TIER2' as PlanType,
    planDuration: 'monthly',
    popular: true,
  },

  pro_quarterly: {
    id: 'pro_quarterly',
    name: 'Pro Quarterly',
    tagline: '22% off vs monthly',
    features: [
      'Everything in Pro Monthly',
      'Billed every 3 months',
      'Lock in the price for the quarter',
    ],
    kind: 'subscription',
    amountPaise: 69900, // ₹699 every 3 months → ~₹233/mo
    displayAmount: '699',
    cadence: '/ 3 months',
    cycleMonths: 3,
    totalCount: 4,
    razorpayPlanEnv: 'RAZORPAY_PRO_QUARTERLY_PLAN_ID',
    userPlanType: 'TIER2' as PlanType,
    planDuration: 'quarterly',
    savingsLabel: 'Save 22%',
  },

  pro_annual: {
    id: 'pro_annual',
    name: 'Pro Annual',
    tagline: 'Best value — 44% off vs monthly',
    features: [
      'Everything in Pro Monthly',
      'Billed once for the year',
      'Lock in the price for 12 months',
      'Effective ₹167 / month',
    ],
    kind: 'subscription',
    amountPaise: 199900, // ₹1,999/yr → ~₹167/mo
    displayAmount: '1,999',
    cadence: '/ year',
    cycleMonths: 12,
    totalCount: 1,
    razorpayPlanEnv: 'RAZORPAY_PRO_ANNUAL_PLAN_ID',
    userPlanType: 'TIER2' as PlanType,
    planDuration: 'yearly',
    savingsLabel: 'Save 44%',
  },
};

export type PlanId = keyof typeof PLAN_CATALOG;

export function getPlan(id: string): PlanCatalogEntry | null {
  return PLAN_CATALOG[id] ?? null;
}

/** Ordered list for the pricing page (free first, then ascending commitment). */
export function getDisplayPlans(): PlanCatalogEntry[] {
  return ['free', 'pack', 'pro_monthly', 'pro_quarterly', 'pro_annual'].map(
    (id) => PLAN_CATALOG[id]
  );
}

/** Resolve a Razorpay plan ID from env for a subscription plan. */
export function getRazorpayPlanId(plan: PlanCatalogEntry): string | null {
  if (plan.kind !== 'subscription' || !plan.razorpayPlanEnv) return null;
  const value = process.env[plan.razorpayPlanEnv];
  return value && value.trim() ? value : null;
}
