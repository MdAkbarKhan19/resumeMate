/**
 * End-to-end-ish auto-enhancer test with a MOCKED model.
 *
 * Drives a realistic résumé + JD through the full tailoring pipeline (skills →
 * experience bullets → reflection → summary → projects) with the LLM mocked, and
 * asserts the guarantees our own code is responsible for:
 *   1. PII (name / email / phone) is NEVER included in anything sent to the model.
 *   2. The fabrication audit strips any "incorporated" keyword that isn't in the
 *      JD pool (e.g. a hallucinated "Redis").
 *   3. A keyword claimed on two bullets is de-duplicated (one placement only).
 *   4. Numbers in the original bullets survive into the enhanced résumé.
 *   5. Change labels are honest (claims only real, surviving keywords).
 *   6. Token + cost usage is tracked (non-zero) for profitability accounting.
 *   7. The reflection pass can revise a flawed bullet and labels are recomputed.
 *
 * The real end-to-end run against a live model lives in auto-enhancer.live.test.ts
 * (skipped unless RUN_LIVE_AI=1 with an API key).
 */

// Capture everything sent to the model so we can assert no PII leaks.
// (Names are mock-prefixed so jest allows them inside the mock factory.)
const mockSent: string[] = [];
let mockReflectionRevision: string | null = null;

function mockCreate({ messages }: any) {
  const sys = messages.find((m: any) => m.role === 'system')?.content || '';
  const user = messages.find((m: any) => m.role === 'user')?.content || '';
  mockSent.push(`${sys}\n${user}`);
  const usage = { prompt_tokens: 200, completion_tokens: 100, total_tokens: 300 };
  const reply = (obj: any) => ({ choices: [{ message: { content: JSON.stringify(obj) } }], usage });

  if (sys.includes('ATS optimization expert. Add skills')) {
    return Promise.resolve(
      reply({
        skills: [
          { name: 'Kubernetes', category: 'Technical', reason: 'containerized services implied' },
          { name: 'CI/CD', category: 'Tools', reason: 'pipeline work' },
        ],
      }),
    );
  }
  if (sys.includes('expert ATS resume optimizer')) {
    return Promise.resolve(
      reply({
        plan: [],
        bullets: [
          // keeps "10M"; injects Kafka (in pool) + Redis (NOT in pool → must be stripped)
          { index: 0, text: 'Engineered **Kafka**-backed data pipeline processing 10M events/day', keywordsIncorporated: ['Kafka', 'Redis'] },
          // claims Kafka again (duplicate → must be dropped); keeps "40%"
          { index: 1, text: 'Cut API response time 40% with a **caching** layer on hot paths', keywordsIncorporated: ['Kafka'] },
        ],
      }),
    );
  }
  if (sys.includes('rigorous resume fact-checker')) {
    if (mockReflectionRevision) {
      return Promise.resolve(
        reply({ verdict: 'issues', perBullet: [{ index: 0, issues: ['too long'], suggestedRevision: mockReflectionRevision }] }),
      );
    }
    return Promise.resolve(reply({ verdict: 'clean', perBullet: [] }));
  }
  if (user.includes('Rewrite the project descriptions')) {
    return Promise.resolve(
      reply({ projects: [{ index: 0, description: 'Built a billing service handling 5000 transactions/day with **Docker**.' }] }),
    );
  }
  if (user.includes('professional summary')) {
    return Promise.resolve(reply({ summary: 'Backend engineer with 6 years building scalable **Kafka** pipelines and REST APIs.' }));
  }
  return Promise.resolve(reply({}));
}

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: { completions: { create: (args: any) => mockCreate(args) } },
  })),
}));

import { AIAutoEnhancer } from '@/lib/ai/auto-enhancer';

const JD: any = {
  jobTitle: 'Backend Engineer',
  requiredSkills: ['Kubernetes', 'Kafka'],
  preferredSkills: [],
  keywords: ['CI/CD'],
  actionVerbs: ['build', 'design'],
  tools: ['Docker'],
  certifications: [],
  education: [],
  experienceYears: undefined,
  responsibilities: [],
  qualifications: [],
  mustHave: ['Kafka'],
  niceToHave: [],
};

function freshResume(): any {
  return {
    personalInfo: { name: 'Jane Smith', email: 'jane.smith@example.com', phone: '+1 (555) 123-4567' },
    summary: 'Backend engineer with 6 years building APIs.',
    experience: [
      {
        jobTitle: 'Senior Engineer',
        company: 'Acme',
        bullets: [
          'Built data pipeline processing 10M events/day',
          'Improved API response time by 40% via caching',
        ],
      },
    ],
    skills: [{ id: '1', name: 'Java', category: 'technical' }],
    projects: [{ name: 'Billing', description: 'A billing service handling 5000 transactions/day' }],
  };
}

describe('AIAutoEnhancer.autoEnhanceResume (mocked model)', () => {
  beforeEach(() => {
    mockSent.length = 0;
    mockReflectionRevision = null;
    process.env.DEEPSEEK_API_KEY = 'sk-test';
    process.env.AI_PROVIDER = 'deepseek';
  });

  test('never sends PII (name / email / phone) to the model', async () => {
    await AIAutoEnhancer.autoEnhanceResume(freshResume(), JD);
    const all = mockSent.join('\n');
    expect(all).not.toContain('jane.smith@example.com');
    expect(all).not.toContain('555');
    expect(all).not.toMatch(/Jane\s*Smith/);
  });

  test('strips fabricated keywords not in the JD pool', async () => {
    const result = await AIAutoEnhancer.autoEnhanceResume(freshResume(), JD);
    const reasons = result.changes.map((c) => c.reason).join(' | ');
    expect(reasons).toContain('Kafka');
    expect(reasons).not.toContain('Redis'); // hallucinated → audited out
  });

  test('de-duplicates a keyword claimed on multiple bullets', async () => {
    const result = await AIAutoEnhancer.autoEnhanceResume(freshResume(), JD);
    const kafkaIncorporations = result.changes.filter(
      (c) => c.section === 'experience' && /Incorporated:.*Kafka/.test(c.reason),
    );
    expect(kafkaIncorporations).toHaveLength(1);
  });

  test('preserves every number from the original bullets', async () => {
    const result = await AIAutoEnhancer.autoEnhanceResume(freshResume(), JD);
    const bullets = result.enhancedResume.experience[0].bullets.join(' ');
    expect(bullets).toContain('10M');
    expect(bullets).toContain('40%');
  });

  test('adds defensible skills (required + methodology keywords)', async () => {
    const result = await AIAutoEnhancer.autoEnhanceResume(freshResume(), JD);
    const names = result.enhancedResume.skills.map((s: any) => (typeof s === 'string' ? s : s.name));
    expect(names).toContain('Kubernetes');
    expect(names).toContain('CI/CD');
  });

  test('tracks non-zero token + cost usage for profitability accounting', async () => {
    const result = await AIAutoEnhancer.autoEnhanceResume(freshResume(), JD);
    expect(result.usage.tokensUsed).toBeGreaterThan(0);
    expect(result.usage.cost).toBeGreaterThan(0);
  });

  test('reflection revises a flagged bullet and keeps labels honest', async () => {
    // Reflection rewrites bullet 0 to a version WITHOUT the Kafka keyword.
    mockReflectionRevision = 'Built a data pipeline processing 10M events/day';
    const result = await AIAutoEnhancer.autoEnhanceResume(freshResume(), JD);
    const bullet0 = result.enhancedResume.experience[0].bullets[0];
    expect(bullet0).toBe('Built a data pipeline processing 10M events/day');
    // Kafka no longer appears in the text, so no change may still claim to have incorporated it.
    const stillClaimsKafka = result.changes.some(
      (c) => c.after === bullet0 && /Incorporated:.*Kafka/.test(c.reason),
    );
    expect(stillClaimsKafka).toBe(false);
  });
});
