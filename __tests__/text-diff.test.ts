/**
 * Word-diff tests.
 *
 * These guard the "show what actually changed" promise in the ATS review UI and
 * the honesty of our change labels. Cases are drawn from real auto-enhance output
 * that a user flagged as "only grammar changes" — including the regression where
 * the rewrite DELETED technical keywords (Spring Boot, OIC, SCM).
 */

import { wordDiff, isCosmeticOnly } from '@/lib/text-diff';

describe('wordDiff', () => {
  test('identical strings produce only "same" segments', () => {
    const segs = wordDiff('Built a REST API', 'Built a REST API');
    expect(segs.every(s => s.type === 'same')).toBe(true);
    expect(segs.map(s => s.value).join('')).toBe('Built a REST API');
  });

  test('a verb swap shows the old verb removed and the new one added', () => {
    const segs = wordDiff(
      'Designed a centralized orchestration layer',
      'Architected a centralized orchestration layer',
    );
    const added = segs.filter(s => s.type === 'added').map(s => s.value.trim()).join(' ');
    const removed = segs.filter(s => s.type === 'removed').map(s => s.value.trim()).join(' ');
    expect(added).toContain('Architected');
    expect(removed).toContain('Designed');
    // The rest is unchanged.
    expect(segs.filter(s => s.type === 'same').map(s => s.value).join('')).toContain('centralized orchestration layer');
  });

  test('detects a DELETED technical keyword (the Spring Boot regression)', () => {
    const before = 'Built an MCP-driven integration layer for SDN microservices (Spring Boot APIs)';
    const after = 'Built an MCP-driven integration layer for SDN microservices';
    const removed = wordDiff(before, after).filter(s => s.type === 'removed').map(s => s.value).join('');
    expect(removed).toContain('Spring Boot');
  });

  test('strips ** bold markers before diffing so injected keywords read as added words', () => {
    const segs = wordDiff('Built a data pipeline', 'Built a **Kafka** data pipeline');
    expect(segs.some(s => s.type === 'added' && s.value.includes('Kafka'))).toBe(true);
    // No stray asterisks leak into the rendered segments.
    expect(segs.every(s => !s.value.includes('**'))).toBe(true);
  });

  test('reconstructing the "after" from non-removed segments matches the plain after text', () => {
    const before = 'Orchestrated the optimization of order status updates';
    const after = 'Optimized order status updates';
    const rebuilt = wordDiff(before, after)
      .filter(s => s.type !== 'removed')
      .map(s => s.value)
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
    expect(rebuilt).toBe(after);
  });
});

describe('isCosmeticOnly', () => {
  test('removing filler/grammar words only is cosmetic', () => {
    expect(
      isCosmeticOnly(
        'enabling efficient and context-aware execution',
        'enabling context-aware execution',
      ),
    ).toBe(true);
  });

  test('a pure verb swap of two real words is NOT cosmetic', () => {
    expect(isCosmeticOnly('Designed the layer', 'Architected the layer')).toBe(false);
  });

  test('adding a real JD keyword is NOT cosmetic', () => {
    expect(isCosmeticOnly('Built a data pipeline', 'Built a Kafka data pipeline')).toBe(false);
  });

  test('DROPPING a technical keyword is NOT cosmetic (it is a regression we must surface)', () => {
    expect(
      isCosmeticOnly(
        'integration layer for SDN microservices (Spring Boot APIs)',
        'integration layer for SDN microservices',
      ),
    ).toBe(false);
  });

  test('identical text is cosmetic (no change)', () => {
    expect(isCosmeticOnly('Built a REST API', 'Built a REST API')).toBe(true);
  });
});
