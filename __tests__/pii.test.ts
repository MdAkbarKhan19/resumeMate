/**
 * PII redaction tests.
 *
 * These guard the privacy promise we make in the UI: a user's direct
 * identifiers (name, email, phone, personal profile URLs) must never be sent to
 * a third-party model. If any of these assertions fail, that claim is false.
 */

import {
  redactPII,
  redactForEnhancement,
  redactForParsing,
  restoreRedactions,
} from '@/lib/ai/pii';

describe('redactPII', () => {
  test('scrubs emails and phones by default', () => {
    const out = redactPII('Reach me at jane.smith@example.com or +1 (555) 123-4567');
    expect(out).not.toContain('jane.smith@example.com');
    expect(out).not.toContain('555');
    expect(out).toContain('[EMAIL]');
    expect(out).toContain('[PHONE]');
  });

  test('does not scrub URLs unless asked', () => {
    const out = redactPII('See myproject.dev for the demo');
    expect(out).toContain('myproject.dev');
  });

  test('scrubs a provided name (full phrase and tokens)', () => {
    const out = redactPII('Jane Smith led the team; Jane shipped it', { names: ['Jane Smith'] });
    expect(out).not.toMatch(/Jane/);
    expect(out).toContain('[NAME]');
  });

  test('is safe on empty/undefined input', () => {
    expect(redactPII('')).toBe('');
    expect(redactPII(undefined)).toBe('');
    expect(redactPII(null)).toBe('');
  });
});

describe('redactForEnhancement', () => {
  test('removes email, phone and candidate name but keeps project URLs', () => {
    const out = redactForEnhancement(
      'Jane built api.acme.com; contact jane@acme.com / 555-867-5309',
      'Jane',
    );
    expect(out).not.toContain('jane@acme.com');
    expect(out).not.toContain('555');
    expect(out).not.toMatch(/\bJane\b/);
    expect(out).toContain('api.acme.com'); // generic URL preserved (it's content)
  });
});

describe('redactForParsing', () => {
  test('scrubs identifiers + personal profile URLs but keeps a generic project link', () => {
    const text =
      'Jane Smith\njane@x.com | 555-111-2222\nlinkedin.com/in/janesmith\nBuilt demo at coolproject.io';
    const out = redactForParsing(text, {
      name: 'Jane Smith',
      personalUrls: ['linkedin.com/in/janesmith'],
    });
    expect(out).not.toContain('jane@x.com');
    expect(out).not.toContain('555');
    expect(out).not.toContain('linkedin.com/in/janesmith');
    expect(out).not.toMatch(/Jane/);
    expect(out).toContain('coolproject.io'); // not a declared personal URL → kept
  });
});

describe('restoreRedactions', () => {
  test('restores known values and clears unknown placeholders, recursively', () => {
    const obj = {
      personalInfo: { name: '[NAME]', email: '[EMAIL]', phone: '[PHONE]' },
      summary: 'Worked with [NAME] on [URL]',
      bullets: ['Contact [EMAIL]', 'plain bullet'],
    };
    const restored = restoreRedactions(obj, {
      name: 'Jane Smith',
      email: 'jane@x.com',
      phone: '555-111-2222',
    });
    expect(restored.personalInfo.name).toBe('Jane Smith');
    expect(restored.personalInfo.email).toBe('jane@x.com');
    expect(restored.summary).toBe('Worked with Jane Smith on '); // [URL] cleared
    expect(restored.bullets[0]).toBe('Contact jane@x.com');
    expect(restored.bullets[1]).toBe('plain bullet');
  });
});
