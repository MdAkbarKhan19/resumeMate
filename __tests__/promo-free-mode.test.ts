/**
 * PROMO_FREE_MODE tests.
 *
 * When the env var `PROMO_FREE_MODE=true`, every user — even a plain FREE
 * account — must be treated as Pro: unlimited resumes / ATS / bullets and NO
 * watermark. When the flag is off (the default), gates must behave EXACTLY as
 * before (this is the "100% revertible" guarantee). These tests pin both
 * directions so the promo can never silently leak past its window.
 */

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
  isPromoFreeMode,
  canCreateResume,
  canRunAtsOptimization,
  canEnhanceBullet,
  shouldWatermark,
} from '@/lib/payment/entitlements';

const mockedPrisma = prisma as unknown as {
  user: { findUnique: jest.Mock };
  resume: { count: jest.Mock };
  aIUsage: { count: jest.Mock };
  payment: { findFirst: jest.Mock };
};

function setFreeUser() {
  mockedPrisma.user.findUnique.mockResolvedValue({
    id: 'u1',
    planType: 'FREE',
    resumeCredits: 0,
    subscriptionActive: false,
    subscriptionExpiry: null,
  });
}

const ORIGINAL = process.env.PROMO_FREE_MODE;

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.PROMO_FREE_MODE;
});

afterAll(() => {
  if (ORIGINAL === undefined) delete process.env.PROMO_FREE_MODE;
  else process.env.PROMO_FREE_MODE = ORIGINAL;
});

describe('isPromoFreeMode', () => {
  test('exactly the string "true" enables it', () => {
    process.env.PROMO_FREE_MODE = 'true';
    expect(isPromoFreeMode()).toBe(true);
  });

  test.each(['false', '1', 'TRUE', 'yes', '', undefined])(
    'value %p does NOT enable it (fail-safe off)',
    (val) => {
      if (val === undefined) delete process.env.PROMO_FREE_MODE;
      else process.env.PROMO_FREE_MODE = val as string;
      expect(isPromoFreeMode()).toBe(false);
    },
  );
});

describe('PROMO_FREE_MODE ON → FREE user gets Pro treatment', () => {
  beforeEach(() => {
    process.env.PROMO_FREE_MODE = 'true';
    setFreeUser();
  });

  test('resumes: unlimited, allowed even with many existing (no count query)', async () => {
    mockedPrisma.resume.count.mockResolvedValue(99);
    const r = await canCreateResume('u1');
    expect(r.allowed).toBe(true);
    expect(r.tier).toBe('pro');
    // Pro path short-circuits before counting — saves a DB hit.
    expect(mockedPrisma.resume.count).not.toHaveBeenCalled();
  });

  test('ATS: unlimited, allowed without usage query', async () => {
    const r = await canRunAtsOptimization('u1');
    expect(r.allowed).toBe(true);
    expect(r.tier).toBe('pro');
    expect(mockedPrisma.aIUsage.count).not.toHaveBeenCalled();
  });

  test('bullets: unlimited, allowed without usage query', async () => {
    const r = await canEnhanceBullet('u1');
    expect(r.allowed).toBe(true);
    expect(r.tier).toBe('pro');
    expect(mockedPrisma.aIUsage.count).not.toHaveBeenCalled();
  });

  test('downloads: NOT watermarked', async () => {
    expect(await shouldWatermark('u1')).toBe(false);
  });
});

describe('PROMO_FREE_MODE OFF → FREE user keeps real free limits (revert proof)', () => {
  beforeEach(() => {
    delete process.env.PROMO_FREE_MODE;
    setFreeUser();
  });

  test('resumes: blocked at the 1-resume cap', async () => {
    mockedPrisma.resume.count.mockResolvedValue(1);
    const r = await canCreateResume('u1');
    expect(r.allowed).toBe(false);
    expect(r.code).toBe('RESUME_LIMIT_REACHED');
    expect(r.tier).toBe('free');
  });

  test('downloads: watermarked again', async () => {
    expect(await shouldWatermark('u1')).toBe(true);
  });
});
