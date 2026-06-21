/**
 * Heuristic (no-AI) resume parser tests.
 *
 * This is the safety net that keeps resume UPLOAD working when the OpenAI parse
 * step is unavailable (the exact production incident: an invalid key 500'd
 * every upload). It must (a) never throw, (b) always return the full expected
 * shape, and (c) lose no data — the complete raw text is preserved so the user
 * can reorganise it in the builder.
 */

import { heuristicParseResume } from '@/lib/resume/heuristic-parser';

const SAMPLE = `Jane Smith
San Francisco, CA
jane.smith@example.com | +1 (555) 123-4567
linkedin.com/in/janesmith  github.com/janesmith  janesmith.dev

Summary
Senior software engineer with 8 years building scalable web apps.

Skills
JavaScript, TypeScript, React, Node.js, PostgreSQL, AWS

Experience
Acme Corp — Senior Engineer
Built things and shipped features.
`;

describe('heuristicParseResume — contact extraction', () => {
  const r = heuristicParseResume(SAMPLE);

  test('extracts email', () => {
    expect(r.personalInfo.email).toBe('jane.smith@example.com');
  });

  test('extracts phone', () => {
    expect(r.personalInfo.phone.replace(/\s/g, '')).toContain('555');
  });

  test('extracts the candidate name from the top of the document', () => {
    expect(r.personalInfo.name).toBe('Jane Smith');
  });

  test('extracts linkedin and github URLs', () => {
    expect(r.personalInfo.linkedin).toMatch(/linkedin\.com\/in\/janesmith/i);
    expect(r.personalInfo.github).toMatch(/github\.com\/janesmith/i);
  });

  test('portfolio URL is neither linkedin nor github', () => {
    expect(r.personalInfo.portfolio).not.toMatch(/linkedin|github/i);
  });

  test('extracts a location', () => {
    expect(r.personalInfo.location).toMatch(/San Francisco/);
  });
});

describe('heuristicParseResume — sections', () => {
  const r = heuristicParseResume(SAMPLE);

  test('parses a skills block into items', () => {
    expect(r.skills).toHaveLength(1);
    expect(r.skills[0].items).toEqual(
      expect.arrayContaining(['JavaScript', 'TypeScript', 'React', 'Node.js']),
    );
  });

  test('captures the summary block', () => {
    expect(r.summary.toLowerCase()).toContain('software engineer');
  });

  test('preserves the FULL raw text in a custom section (zero data loss)', () => {
    expect(r.customSections).toHaveLength(1);
    expect(r.customSections[0].content).toContain('Acme Corp');
    expect(r.customSections[0].content).toContain('shipped features');
  });

  test('flags that the fallback was used (so callers can warn the user)', () => {
    expect(r.metadata.usedFallback).toBe(true);
  });
});

describe('heuristicParseResume — robustness (must never throw)', () => {
  test.each([
    ['empty string', ''],
    ['whitespace only', '   \n\t  '],
    ['garbage', '@@@###$$$ 12345 !!!'],
    ['single email', 'contact me at hi@x.io'],
  ])('handles %s without throwing and returns full shape', (_label, input) => {
    const r = heuristicParseResume(input as string);
    // Every list field is an array.
    for (const k of [
      'experience', 'education', 'skills', 'projects', 'certifications',
      'languages', 'volunteer', 'awards', 'publications', 'customSections',
    ] as const) {
      expect(Array.isArray(r[k])).toBe(true);
    }
    expect(typeof r.personalInfo.name).toBe('string');
    expect(typeof r.summary).toBe('string');
  });

  test('null/undefined input is tolerated', () => {
    // @ts-expect-error — deliberately passing a bad value to prove resilience.
    expect(() => heuristicParseResume(undefined)).not.toThrow();
  });
});
