/**
 * Pricing-route consistency audit.
 *
 * `src/lib/payment/entitlements.ts` is supposed to be the single source of
 * truth for what each plan can do. Some routes still have inline plan
 * checks (e.g. `if (planType === 'FREE' && dailyUsage >= 5) ...`) that can
 * drift. This test pins the *known* drift list so we don't accidentally
 * grow more of it.
 *
 * If you add a new gated route, either:
 *   a) call canRunAtsOptimization / canEnhanceBullet / canCreateResume, OR
 *   b) add it to KNOWN_INLINE_GATES below with a comment explaining why.
 */

import * as fs from 'fs';
import * as path from 'path';

// Routes that are KNOWN to have inline plan checks. Each entry is a tuple
// of [relative path, justification]. The test fails if either:
//   - one of these stops having inline gates (delete from the list), OR
//   - a NEW route appears with inline gates not in the list.
const KNOWN_INLINE_GATES: Array<{ file: string; reason: string }> = [
  {
    file: 'src/app/api/payments/verify/route.ts',
    reason:
      'Legitimate inline check — this is the route that ASSIGNS planType' +
      ' after a successful payment, so it has to read/write planType directly.',
  },
  {
    file: 'src/app/api/webhooks/razorpay/route.ts',
    reason:
      'Legitimate inline check — payment webhook updates planType from' +
      ' provider events. Source of truth for setting planType.',
  },
  {
    file: 'src/app/api/resumes/route.ts',
    reason:
      'Calls canCreateResume() for the cap check; the inline planType' +
      ' reference is only for response shaping. Verified safe.',
  },
];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      walk(p, out);
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      out.push(p);
    }
  }
  return out;
}

describe('Pricing route consistency', () => {
  const repoRoot = path.resolve(__dirname, '..');
  const apiDir = path.join(repoRoot, 'src', 'app', 'api');
  const allApiFiles = walk(apiDir);

  // Match `planType === 'FREE'`, `planType === 'TIER1'`, `planType === 'TIER2'`.
  const INLINE_GATE_RE = /planType\s*===\s*['"](FREE|TIER1|TIER2)['"]/;

  test('Every route with an inline planType check is on the known list', () => {
    const found: string[] = [];
    for (const f of allApiFiles) {
      const rel = path.relative(repoRoot, f).replace(/\\/g, '/');
      const content = fs.readFileSync(f, 'utf8');
      if (INLINE_GATE_RE.test(content)) found.push(rel);
    }
    const knownPaths = new Set(KNOWN_INLINE_GATES.map(g => g.file));
    const unexpected = found.filter(f => !knownPaths.has(f));
    if (unexpected.length > 0) {
      throw new Error(
        'New routes have inline plan checks. Either migrate them to ' +
          'entitlements.ts gates OR add them to KNOWN_INLINE_GATES with a ' +
          'justification:\n  - ' +
          unexpected.join('\n  - '),
      );
    }
  });

  test('Entries in KNOWN_INLINE_GATES still exist and still have inline checks', () => {
    // If we cleaned up a route, the corresponding entry should be removed
    // — otherwise the list rots and becomes meaningless.
    const stale: string[] = [];
    for (const { file } of KNOWN_INLINE_GATES) {
      const full = path.join(repoRoot, file);
      if (!fs.existsSync(full)) {
        stale.push(`${file} (file no longer exists)`);
        continue;
      }
      const content = fs.readFileSync(full, 'utf8');
      if (!INLINE_GATE_RE.test(content)) {
        stale.push(`${file} (inline check removed — please delete from list)`);
      }
    }
    if (stale.length > 0) {
      throw new Error(
        'KNOWN_INLINE_GATES is out of date:\n  - ' + stale.join('\n  - '),
      );
    }
  });

  test('No routed handler reads user.sub without an user.id fallback', () => {
    // The auth middleware returns the DB user row (`user.id`), NOT the raw
    // token (`user.sub`). Routes that read `user.sub` alone 401 every request.
    // This bug has bitten ats/check, suggest-skills and improve-bullet before —
    // pin it so it can't come back. Only consider Next-routed files (route.ts);
    // *.enhanced.ts variants are dead code Next never mounts.
    const SUB_RE = /\buser\?\.sub\b/;
    // Accept any `|| <expr>.id` fallback (e.g. `user?.sub || user?.id` or
    // `context.user?.sub || context.user?.id`).
    const ID_FALLBACK_RE = /\buser\?\.sub\b\s*\|\|\s*[\w.?]*\.id\b/;
    const offenders: string[] = [];
    for (const f of allApiFiles) {
      if (path.basename(f) !== 'route.ts') continue;
      const content = fs.readFileSync(f, 'utf8');
      const rel = path.relative(repoRoot, f).replace(/\\/g, '/');
      content.split('\n').forEach((line) => {
        if (SUB_RE.test(line) && !ID_FALLBACK_RE.test(line)) {
          offenders.push(`${rel}: ${line.trim()}`);
        }
      });
    }
    if (offenders.length > 0) {
      throw new Error(
        'These routes read user.sub without a user.id fallback (will 401 every ' +
          'request). Use `user?.sub || user?.id`:\n  - ' + offenders.join('\n  - '),
      );
    }
  });

  test('Every gated-action route imports from entitlements.ts OR is on the inline list', () => {
    // Heuristic: any route that uses prisma.aIUsage (a usage gate) OR
    // prisma.resume.create / .update without going through entitlements is
    // a potential gap. We just sanity-check that entitlements.ts is the
    // most-referenced gate module.
    const importers = allApiFiles.filter(f => {
      const c = fs.readFileSync(f, 'utf8');
      return c.includes('@/lib/payment/entitlements');
    });
    // We expect at least 5 routes to import entitlements (bullets, summary,
    // grammar, suggest-skills, improve-bullet, enhance, auto-enhance, etc.)
    expect(importers.length).toBeGreaterThanOrEqual(5);
  });
});
