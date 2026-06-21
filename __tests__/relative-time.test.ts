/**
 * relativeTime() tests — the friendly "Edited X ago" label on saved-resume cards.
 */

import { relativeTime } from '@/lib/utils';

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('relativeTime', () => {
  test('just now for very recent edits', () => {
    expect(relativeTime(ago(5 * SEC))).toBe('Just now');
  });

  test('minutes', () => {
    expect(relativeTime(ago(5 * MIN))).toBe('5 minutes ago');
  });

  test('hours (singular + plural)', () => {
    expect(relativeTime(ago(1 * HOUR))).toBe('1 hour ago');
    expect(relativeTime(ago(5 * HOUR))).toBe('5 hours ago');
  });

  test('yesterday and days', () => {
    expect(relativeTime(ago(1 * DAY))).toBe('Yesterday');
    expect(relativeTime(ago(3 * DAY))).toBe('3 days ago');
  });

  test('falls back to an absolute date for old timestamps', () => {
    const out = relativeTime(ago(60 * DAY));
    expect(out).toMatch(/\d{4}/); // contains a year, i.e. absolute formatDate
    expect(out).not.toMatch(/ago/);
  });

  test('handles invalid input gracefully', () => {
    expect(relativeTime('not-a-date')).toBe('');
  });

  test('future timestamps (clock skew) read as just now', () => {
    expect(relativeTime(new Date(Date.now() + 10 * SEC).toISOString())).toBe('Just now');
  });
});
