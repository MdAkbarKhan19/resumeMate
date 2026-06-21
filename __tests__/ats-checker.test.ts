/**
 * ATS checker tests.
 *
 * `ATSCheckerService.analyzeMatch` is fully local (no OpenAI), so it must keep
 * working even when the AI key is down. These tests pin the contract the
 * builder's ATS panel relies on: a bounded score, a sensible breakdown, and
 * that a relevant resume genuinely out-scores an empty one against the same JD.
 */

import { ATSCheckerService } from '@/lib/ai/ats-checker';

const JD = `We are hiring a Senior Frontend Engineer. You will work with React,
TypeScript, and Node.js to build scalable web applications on AWS. Experience
with PostgreSQL, REST APIs, and CI/CD pipelines is required. Strong testing
practices (Jest, Cypress) and Agile experience preferred.`;

const STRONG_RESUME = {
  summary: 'Senior frontend engineer specialising in React and TypeScript.',
  experience: [
    {
      bullets: [
        'Built scalable web applications using React, TypeScript and Node.js on AWS.',
        'Designed REST APIs backed by PostgreSQL and shipped via CI/CD pipelines.',
        'Wrote unit and e2e tests with Jest and Cypress in an Agile team.',
      ],
    },
  ],
  skills: [
    { name: 'React' }, { name: 'TypeScript' }, { name: 'Node.js' },
    { name: 'AWS' }, { name: 'PostgreSQL' }, { name: 'Jest' },
  ],
  education: [{ degree: 'BSc Computer Science' }],
};

const EMPTY_RESUME = {
  summary: '',
  experience: [{ bullets: ['Did some work at a company.'] }],
  skills: [{ name: 'Cooking' }],
  education: [{ degree: 'High School Diploma' }],
};

describe('ATSCheckerService.extractKeywords', () => {
  test('picks up well-known technical skills from a JD', () => {
    const kw = ATSCheckerService.extractKeywords(JD);
    expect(kw.all.length).toBeGreaterThan(0);
    const allLower = kw.all.map((k) => k.toLowerCase());
    expect(allLower).toEqual(expect.arrayContaining(['react', 'typescript']));
  });
});

describe('ATSCheckerService.analyzeMatch', () => {
  test('returns a score within 0..100', () => {
    const res = ATSCheckerService.analyzeMatch(STRONG_RESUME, JD);
    expect(res.score).toBeGreaterThanOrEqual(0);
    expect(res.score).toBeLessThanOrEqual(100);
  });

  test('a relevant resume out-scores an empty/irrelevant one for the same JD', () => {
    const strong = ATSCheckerService.analyzeMatch(STRONG_RESUME, JD).score;
    const weak = ATSCheckerService.analyzeMatch(EMPTY_RESUME, JD).score;
    expect(strong).toBeGreaterThan(weak);
  });

  test('matched keywords include skills present in both resume and JD', () => {
    const res = ATSCheckerService.analyzeMatch(STRONG_RESUME, JD);
    const matchedLower = res.matchedKeywords.map((k) => k.toLowerCase());
    expect(matchedLower).toEqual(expect.arrayContaining(['react', 'typescript']));
  });

  test('exposes a structured breakdown the UI can render', () => {
    const res = ATSCheckerService.analyzeMatch(STRONG_RESUME, JD);
    expect(res.breakdown).toHaveProperty('keywords.percentage');
    expect(res.breakdown).toHaveProperty('skills.percentage');
    expect(res.breakdown).toHaveProperty('experience.score');
    expect(res.breakdown).toHaveProperty('formatting.score');
    expect(Array.isArray(res.recommendations)).toBe(true);
  });

  test('missing keywords are capped at 20 for a clean UI', () => {
    const res = ATSCheckerService.analyzeMatch(EMPTY_RESUME, JD);
    expect(res.missingKeywords.length).toBeLessThanOrEqual(20);
  });

  test('does NOT throw on malformed resume content (no name / no bullets)', () => {
    // Reproduces the production 500: skills stored without a `.name`, plus an
    // experience entry missing `bullets`. Must degrade gracefully, not crash.
    const malformed = {
      summary: '',
      experience: [{} as any, { bullets: ['Used React and TypeScript.'] }],
      skills: [{} as any, { name: undefined } as any, { name: 'React' }],
      education: [{} as any],
    };
    let res: ReturnType<typeof ATSCheckerService.analyzeMatch> | undefined;
    expect(() => { res = ATSCheckerService.analyzeMatch(malformed as any, JD); }).not.toThrow();
    expect(res!.score).toBeGreaterThanOrEqual(0);
    expect(res!.score).toBeLessThanOrEqual(100);
  });
});
