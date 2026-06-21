/**
 * LIVE end-to-end tailoring check against the REAL model.
 *
 * This is the "write a proper résumé, paste a real JD, tailor it, and verify
 * everything is perfect" run. It is SKIPPED in CI and normal `npm test`. To run
 * it against the real provider:
 *
 *   RUN_LIVE_AI=1 DEEPSEEK_API_KEY=sk-xxx npx jest auto-enhancer.live
 *   # or, on OpenAI:
 *   RUN_LIVE_AI=1 AI_PROVIDER=openai OPENAI_API_KEY=sk-xxx npx jest auto-enhancer.live
 *
 * It asserts the non-negotiables (every number preserved, score does not drop)
 * and prints the before/after bullets, score, and cost so you can eyeball that
 * the result reads like a human wrote it — not AI filler.
 */

import { JobDescriptionAnalyzer } from '@/lib/ai/jd-analyzer';
import { AIAutoEnhancer } from '@/lib/ai/auto-enhancer';

const LIVE = process.env.RUN_LIVE_AI === '1';
const dscribe = LIVE ? describe : describe.skip;

// A realistic résumé with real, metric-bearing experience bullets.
const RESUME: any = {
  personalInfo: { name: 'Alex Rivera', email: 'alex.rivera@example.com', phone: '+1 (555) 010-2030' },
  summary: 'Backend engineer with 6 years building high-throughput services and APIs.',
  experience: [
    {
      jobTitle: 'Senior Backend Engineer',
      company: 'PayStack',
      startDate: '2021-01',
      current: true,
      bullets: [
        'Designed and built REST APIs in Java handling 12M requests/day at 99.9% uptime',
        'Reduced p95 latency by 35% by adding a caching layer and tuning database queries',
        'Led a team of 4 engineers to migrate a monolith to microservices over 8 months',
      ],
    },
    {
      jobTitle: 'Software Engineer',
      company: 'Flux',
      startDate: '2018-06',
      endDate: '2020-12',
      bullets: [
        'Built an event-driven data pipeline processing 5M events/day',
        'Automated deployments with CI/CD, cutting release time from 2 hours to 15 minutes',
      ],
    },
  ],
  skills: [
    { id: '1', name: 'Java', category: 'technical' },
    { id: '2', name: 'PostgreSQL', category: 'technical' },
  ],
  projects: [{ name: 'OpenLedger', description: 'A double-entry ledger library used in 3 internal services.' }],
};

const JD_TEXT = `Senior Backend Engineer

We are looking for a Senior Backend Engineer to design and scale our distributed microservices.

Required:
- Strong Java and Spring Boot
- Kubernetes and Docker in production
- Kafka or other event streaming
- AWS, PostgreSQL, REST APIs
- CI/CD pipelines

Responsibilities:
- Architect distributed systems and event-driven services
- Lead code reviews and mentor engineers

Preferred: Redis, Terraform, observability (Prometheus/Grafana).
5+ years of backend experience required.`;

// Every number that MUST survive tailoring, verbatim.
const REQUIRED_NUMBERS = ['12M', '99.9%', '35%', '4', '8', '5M', '2 hours', '15 minutes', '3'];

function flattenBullets(resume: any): string {
  return (resume.experience || [])
    .flatMap((e: any) => e.bullets || [])
    .join(' \n ');
}

dscribe('LIVE: tailor a real résumé to a real JD', () => {
  jest.setTimeout(180_000);

  test('preserves every number, does not drop the score, and tracks cost', async () => {
    const jd = await JobDescriptionAnalyzer.analyzeJobDescription(JD_TEXT);
    const before = await JobDescriptionAnalyzer.calculateATSScore(RESUME, jd);
    const result = await AIAutoEnhancer.autoEnhanceResume(RESUME, jd);
    const after = await JobDescriptionAnalyzer.calculateATSScore(result.enhancedResume, jd);

    const enhancedText = flattenBullets(result.enhancedResume);

    // eslint-disable-next-line no-console
    console.log('\n=== BEFORE ===\n' + flattenBullets(RESUME));
    // eslint-disable-next-line no-console
    console.log('\n=== AFTER ===\n' + enhancedText);
    // eslint-disable-next-line no-console
    console.log(`\n=== SCORE: ${before.overall} → ${after.overall}  |  cost ~$${result.usage.cost.toFixed(5)} (${result.usage.tokensUsed} tokens) ===\n`);

    // Non-negotiable: no number may be lost or altered.
    for (const num of REQUIRED_NUMBERS) {
      expect(enhancedText).toContain(num);
    }

    // Tailoring must not make the match worse.
    expect(after.overall).toBeGreaterThanOrEqual(before.overall);

    // Cost must be accounted for.
    expect(result.usage.cost).toBeGreaterThan(0);
  });
});
