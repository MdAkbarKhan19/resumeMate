/**
 * Entitlements gate tests.
 *
 * `src/lib/payment/entitlements.ts` is the single source of truth for what
 * each plan can do. If a gate here regresses, paying users either lose
 * features they paid for OR free users get features they shouldn't — both
 * are bad. These tests pin every gate against the documented plan table:
 *
 *   FREE   → 1 resume, 3 ATS optimizations / month, 10 bullet AI / day, watermarked
 *   PACK   → 1 resume per pack,  5 ATS optimizations per pack, unlimited bullets, no watermark
 *   PRO    → unlimited resumes, unlimited ATS, unlimited bullets, no watermark
 */

// Mock prisma BEFORE importing the module under test, so the import-time
// `import prisma from '@/lib/db/prisma'` resolves to our mock.
jest.mock('@/lib/db/prisma', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
    resume: { count: jest.fn() },
    aIUsage: { count: jest.fn() },
    payment: { findFirst: jest.fn() },
  },
}));

import prisma from '@/lib/db/prisma';
import {
  canCreateResume,
  canRunAtsOptimization,
  canEnhanceBullet,
  shouldWatermark,
} from '@/lib/payment/entitlements';

type AnyUser = Parameters<typeof prisma.user.findUnique>[0];

const mockedPrisma = prisma as unknown as {
  user: { findUnique: jest.Mock };
  resume: { count: jest.Mock };
  aIUsage: { count: jest.Mock };
  payment: { findFirst: jest.Mock };
};

// Helper: stub the user row prisma returns when entitlements.ts asks for it.
function setUser(row: {
  planType: 'FREE' | 'TIER1' | 'TIER2';
  resumeCredits?: number;
  subscriptionActive?: boolean;
  subscriptionExpiry?: Date | null;
}) {
  mockedPrisma.user.findUnique.mockResolvedValue({
    id: 'u1',
    planType: row.planType,
    resumeCredits: row.resumeCredits ?? 0,
    subscriptionActive: row.subscriptionActive ?? false,
    subscriptionExpiry: row.subscriptionExpiry ?? null,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────
// Tier resolution — the heart of pricing. Every gate funnels through here.
// ─────────────────────────────────────────────────────────────────────────

describe('Tier resolution via canCreateResume (indirect smoke test)', () => {
  test('Plain FREE user resolves to free tier', async () => {
    setUser({ planType: 'FREE' });
    mockedPrisma.resume.count.mockResolvedValue(0);
    const r = await canCreateResume('u1');
    expect(r.tier).toBe('free');
  });

  test('TIER1 with zero credits is treated as free (pack exhausted)', async () => {
    setUser({ planType: 'TIER1', resumeCredits: 0 });
    mockedPrisma.resume.count.mockResolvedValue(0);
    const r = await canCreateResume('u1');
    expect(r.tier).toBe('free');
  });

  test('TIER1 with credits resolves to pack tier', async () => {
    setUser({ planType: 'TIER1', resumeCredits: 1 });
    mockedPrisma.resume.count.mockResolvedValue(0);
    const r = await canCreateResume('u1');
    expect(r.tier).toBe('pack');
  });

  test('TIER2 with active subscription resolves to pro tier', async () => {
    setUser({
      planType: 'TIER2',
      subscriptionActive: true,
      subscriptionExpiry: new Date(Date.now() + 86400_000),
    });
    const r = await canCreateResume('u1');
    expect(r.tier).toBe('pro');
  });

  test('TIER2 with subscriptionActive=true but expired date is treated as free', async () => {
    setUser({
      planType: 'TIER2',
      subscriptionActive: true,
      subscriptionExpiry: new Date(Date.now() - 86400_000),
    });
    mockedPrisma.resume.count.mockResolvedValue(0);
    const r = await canCreateResume('u1');
    expect(r.tier).toBe('free');
  });

  test('TIER2 with subscriptionActive=false is treated as free', async () => {
    setUser({ planType: 'TIER2', subscriptionActive: false });
    mockedPrisma.resume.count.mockResolvedValue(0);
    const r = await canCreateResume('u1');
    expect(r.tier).toBe('free');
  });

  test('TIER2 active with null expiry (lifetime) resolves to pro', async () => {
    setUser({
      planType: 'TIER2',
      subscriptionActive: true,
      subscriptionExpiry: null,
    });
    const r = await canCreateResume('u1');
    expect(r.tier).toBe('pro');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// canCreateResume — active-resume cap
// ─────────────────────────────────────────────────────────────────────────

describe('canCreateResume', () => {
  test('FREE with zero resumes: allowed, used=0/limit=1', async () => {
    setUser({ planType: 'FREE' });
    mockedPrisma.resume.count.mockResolvedValue(0);
    const r = await canCreateResume('u1');
    expect(r.allowed).toBe(true);
    expect(r.used).toBe(0);
    expect(r.limit).toBe(1);
  });

  test('FREE with one resume: blocked with RESUME_LIMIT_REACHED', async () => {
    setUser({ planType: 'FREE' });
    mockedPrisma.resume.count.mockResolvedValue(1);
    const r = await canCreateResume('u1');
    expect(r.allowed).toBe(false);
    expect(r.code).toBe('RESUME_LIMIT_REACHED');
    expect(r.reason).toMatch(/upgrade/i);
  });

  test('PACK with zero resumes: allowed', async () => {
    setUser({ planType: 'TIER1', resumeCredits: 1 });
    mockedPrisma.resume.count.mockResolvedValue(0);
    const r = await canCreateResume('u1');
    expect(r.allowed).toBe(true);
  });

  test('PACK with one resume: blocked (same 1-resume cap as free)', async () => {
    setUser({ planType: 'TIER1', resumeCredits: 1 });
    mockedPrisma.resume.count.mockResolvedValue(1);
    const r = await canCreateResume('u1');
    expect(r.allowed).toBe(false);
    expect(r.code).toBe('RESUME_LIMIT_REACHED');
  });

  test('PRO with many resumes: allowed (unlimited)', async () => {
    setUser({
      planType: 'TIER2',
      subscriptionActive: true,
      subscriptionExpiry: new Date(Date.now() + 86400_000),
    });
    // Even setting count high — pro doesn't query it but if it does, prove it ignores.
    mockedPrisma.resume.count.mockResolvedValue(999);
    const r = await canCreateResume('u1');
    expect(r.allowed).toBe(true);
    expect(r.tier).toBe('pro');
  });

  test('PRO: the count query is skipped entirely (avoids a DB hit per call)', async () => {
    setUser({
      planType: 'TIER2',
      subscriptionActive: true,
      subscriptionExpiry: null,
    });
    await canCreateResume('u1');
    expect(mockedPrisma.resume.count).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// canRunAtsOptimization — monthly (free) / per-pack (pack) / unlimited (pro)
// ─────────────────────────────────────────────────────────────────────────

describe('canRunAtsOptimization', () => {
  test('FREE under monthly cap: allowed', async () => {
    setUser({ planType: 'FREE' });
    mockedPrisma.aIUsage.count.mockResolvedValue(2);
    const r = await canRunAtsOptimization('u1');
    expect(r.allowed).toBe(true);
    expect(r.used).toBe(2);
    expect(r.limit).toBe(3);
    expect(r.resetsAt).toBeInstanceOf(Date);
  });

  test('FREE at monthly cap: blocked with ATS_LIMIT_REACHED', async () => {
    setUser({ planType: 'FREE' });
    mockedPrisma.aIUsage.count.mockResolvedValue(3);
    const r = await canRunAtsOptimization('u1');
    expect(r.allowed).toBe(false);
    expect(r.code).toBe('ATS_LIMIT_REACHED');
    expect(r.reason).toMatch(/3 ATS/);
    expect(r.reason).toMatch(/1st/i);
  });

  test('FREE over monthly cap (clock drift / race): still blocked', async () => {
    setUser({ planType: 'FREE' });
    mockedPrisma.aIUsage.count.mockResolvedValue(7);
    const r = await canRunAtsOptimization('u1');
    expect(r.allowed).toBe(false);
  });

  test('FREE: query window starts at first of current month', async () => {
    setUser({ planType: 'FREE' });
    mockedPrisma.aIUsage.count.mockResolvedValue(0);
    await canRunAtsOptimization('u1');
    const args = mockedPrisma.aIUsage.count.mock.calls[0][0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    expect(args.where.createdAt.gte.getTime()).toBe(monthStart.getTime());
  });

  test('FREE: counts only AUTO_ENHANCEMENT and JD_MATCHING usage types', async () => {
    setUser({ planType: 'FREE' });
    mockedPrisma.aIUsage.count.mockResolvedValue(0);
    await canRunAtsOptimization('u1');
    const args = mockedPrisma.aIUsage.count.mock.calls[0][0];
    expect(args.where.type.in).toEqual(
      expect.arrayContaining(['AUTO_ENHANCEMENT', 'JD_MATCHING'])
    );
    expect(args.where.type.in).toHaveLength(2);
  });

  test('PACK under per-pack cap: allowed', async () => {
    setUser({ planType: 'TIER1', resumeCredits: 1 });
    mockedPrisma.payment.findFirst.mockResolvedValue({ createdAt: new Date('2025-01-15') });
    mockedPrisma.aIUsage.count.mockResolvedValue(4);
    const r = await canRunAtsOptimization('u1');
    expect(r.allowed).toBe(true);
    expect(r.limit).toBe(5);
  });

  test('PACK at per-pack cap: blocked', async () => {
    setUser({ planType: 'TIER1', resumeCredits: 1 });
    mockedPrisma.payment.findFirst.mockResolvedValue({ createdAt: new Date('2025-01-15') });
    mockedPrisma.aIUsage.count.mockResolvedValue(5);
    const r = await canRunAtsOptimization('u1');
    expect(r.allowed).toBe(false);
    expect(r.code).toBe('ATS_LIMIT_REACHED');
    expect(r.reason).toMatch(/Buy another pack/i);
  });

  test('PACK with no payment record: window starts at epoch (no scans ever counted yet)', async () => {
    setUser({ planType: 'TIER1', resumeCredits: 1 });
    mockedPrisma.payment.findFirst.mockResolvedValue(null);
    mockedPrisma.aIUsage.count.mockResolvedValue(0);
    await canRunAtsOptimization('u1');
    const args = mockedPrisma.aIUsage.count.mock.calls[0][0];
    expect(args.where.createdAt.gte.getTime()).toBe(0);
  });

  test('PACK: window starts at most recent COMPLETED TIER1 payment', async () => {
    setUser({ planType: 'TIER1', resumeCredits: 1 });
    const purchase = new Date('2025-03-01');
    mockedPrisma.payment.findFirst.mockResolvedValue({ createdAt: purchase });
    mockedPrisma.aIUsage.count.mockResolvedValue(0);
    await canRunAtsOptimization('u1');
    const findArgs = mockedPrisma.payment.findFirst.mock.calls[0][0];
    expect(findArgs.where).toMatchObject({
      userId: 'u1',
      status: 'COMPLETED',
      planType: 'TIER1',
    });
    expect(findArgs.orderBy).toEqual({ createdAt: 'desc' });
    const countArgs = mockedPrisma.aIUsage.count.mock.calls[0][0];
    expect(countArgs.where.createdAt.gte).toBe(purchase);
  });

  test('PRO: allowed without any DB count query', async () => {
    setUser({
      planType: 'TIER2',
      subscriptionActive: true,
      subscriptionExpiry: new Date(Date.now() + 86400_000),
    });
    const r = await canRunAtsOptimization('u1');
    expect(r.allowed).toBe(true);
    expect(r.tier).toBe('pro');
    expect(mockedPrisma.aIUsage.count).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// canEnhanceBullet — daily quota shared across small AI helpers (free only)
// ─────────────────────────────────────────────────────────────────────────

describe('canEnhanceBullet', () => {
  test('FREE under daily cap: allowed', async () => {
    setUser({ planType: 'FREE' });
    mockedPrisma.aIUsage.count.mockResolvedValue(5);
    const r = await canEnhanceBullet('u1');
    expect(r.allowed).toBe(true);
    expect(r.used).toBe(5);
    expect(r.limit).toBe(10);
  });

  test('FREE at daily cap: blocked with BULLET_LIMIT_REACHED', async () => {
    setUser({ planType: 'FREE' });
    mockedPrisma.aIUsage.count.mockResolvedValue(10);
    const r = await canEnhanceBullet('u1');
    expect(r.allowed).toBe(false);
    expect(r.code).toBe('BULLET_LIMIT_REACHED');
    expect(r.reason).toMatch(/midnight/i);
  });

  test('FREE: counts ALL helper types (enhance + summary + grammar + redundancy)', async () => {
    // Anti-abuse: prevent 10×each helper. They share one pool.
    setUser({ planType: 'FREE' });
    mockedPrisma.aIUsage.count.mockResolvedValue(0);
    await canEnhanceBullet('u1');
    const args = mockedPrisma.aIUsage.count.mock.calls[0][0];
    expect(args.where.type.in).toEqual(
      expect.arrayContaining([
        'BULLET_ENHANCEMENT',
        'SUMMARY_GENERATION',
        'GRAMMAR_CHECK',
        'REDUNDANCY_CHECK',
      ])
    );
  });

  test('FREE: window starts at midnight of today', async () => {
    setUser({ planType: 'FREE' });
    mockedPrisma.aIUsage.count.mockResolvedValue(0);
    await canEnhanceBullet('u1');
    const args = mockedPrisma.aIUsage.count.mock.calls[0][0];
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    expect(args.where.createdAt.gte.getTime()).toBe(midnight.getTime());
  });

  test('PACK: bullets are unlimited, no DB count', async () => {
    setUser({ planType: 'TIER1', resumeCredits: 1 });
    const r = await canEnhanceBullet('u1');
    expect(r.allowed).toBe(true);
    expect(r.tier).toBe('pack');
    expect(mockedPrisma.aIUsage.count).not.toHaveBeenCalled();
  });

  test('PRO: bullets are unlimited, no DB count', async () => {
    setUser({
      planType: 'TIER2',
      subscriptionActive: true,
      subscriptionExpiry: null,
    });
    const r = await canEnhanceBullet('u1');
    expect(r.allowed).toBe(true);
    expect(r.tier).toBe('pro');
    expect(mockedPrisma.aIUsage.count).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// shouldWatermark — fail-closed safety net for downloads
// ─────────────────────────────────────────────────────────────────────────

describe('shouldWatermark', () => {
  test('FREE → true (watermark applied)', async () => {
    setUser({ planType: 'FREE' });
    expect(await shouldWatermark('u1')).toBe(true);
  });

  test('PACK → false (clean download)', async () => {
    setUser({ planType: 'TIER1', resumeCredits: 1 });
    expect(await shouldWatermark('u1')).toBe(false);
  });

  test('PRO → false (clean download)', async () => {
    setUser({
      planType: 'TIER2',
      subscriptionActive: true,
      subscriptionExpiry: null,
    });
    expect(await shouldWatermark('u1')).toBe(false);
  });

  test('Expired PRO subscription → true (drops to free tier → watermarked)', async () => {
    setUser({
      planType: 'TIER2',
      subscriptionActive: true,
      subscriptionExpiry: new Date(Date.now() - 86400_000),
    });
    expect(await shouldWatermark('u1')).toBe(true);
  });

  test('TIER1 with zero credits → true (pack exhausted, dropped to free)', async () => {
    setUser({ planType: 'TIER1', resumeCredits: 0 });
    expect(await shouldWatermark('u1')).toBe(true);
  });

  test('DB error / missing user → true (fail-closed)', async () => {
    mockedPrisma.user.findUnique.mockRejectedValueOnce(
      new Error('Test entitlement error'),
    );
    expect(await shouldWatermark('u1')).toBe(true);
  });

  test('Missing user record → true (fail-closed)', async () => {
    mockedPrisma.user.findUnique.mockResolvedValueOnce(null);
    expect(await shouldWatermark('u1')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Cross-cutting invariants — properties that MUST hold for the pricing
// promise to stay honest. If any of these fail, an entire tier is broken.
// ─────────────────────────────────────────────────────────────────────────

describe('Cross-cutting invariants', () => {
  test('Every gate returns a tier on the result', async () => {
    setUser({ planType: 'FREE' });
    mockedPrisma.resume.count.mockResolvedValue(0);
    mockedPrisma.aIUsage.count.mockResolvedValue(0);
    const a = await canCreateResume('u1');
    const b = await canRunAtsOptimization('u1');
    const c = await canEnhanceBullet('u1');
    expect(a.tier).toBeDefined();
    expect(b.tier).toBeDefined();
    expect(c.tier).toBeDefined();
  });

  test('Blocking results always carry a code (UI needs it to map to upsell)', async () => {
    setUser({ planType: 'FREE' });
    mockedPrisma.resume.count.mockResolvedValue(1);
    mockedPrisma.aIUsage.count.mockResolvedValue(10);
    const a = await canCreateResume('u1');
    const b = await canRunAtsOptimization('u1');
    const c = await canEnhanceBullet('u1');
    expect(a.code).toBeTruthy();
    expect(b.code).toBeTruthy();
    expect(c.code).toBeTruthy();
  });

  test('Pro tier never queries usage tables (perf + cost)', async () => {
    setUser({
      planType: 'TIER2',
      subscriptionActive: true,
      subscriptionExpiry: null,
    });
    await canCreateResume('u1');
    await canRunAtsOptimization('u1');
    await canEnhanceBullet('u1');
    expect(mockedPrisma.resume.count).not.toHaveBeenCalled();
    expect(mockedPrisma.aIUsage.count).not.toHaveBeenCalled();
    expect(mockedPrisma.payment.findFirst).not.toHaveBeenCalled();
  });
});
