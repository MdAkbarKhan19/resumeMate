/**
 * Word-level diff between two strings.
 *
 * Used to show the user EXACTLY which words an AI rewrite changed, instead of a
 * generic "Rewritten for impact" label that oversells a cosmetic edit. A
 * grammar-only tweak then visibly reads as a grammar-only tweak; a real
 * keyword/structure change visibly reads as one.
 *
 * Classic LCS over word tokens. `**bold**` markers are stripped before diffing
 * so injected keywords surface as ordinary "added" words rather than noise.
 */

export type DiffOp = 'same' | 'added' | 'removed';
export interface DiffSegment {
  value: string;
  type: DiffOp;
}

function stripBold(s: string): string {
  return (s || '').replace(/\*\*/g, '');
}

/** Split into word-with-trailing-space tokens so segments re-stitch cleanly. */
function tokenize(s: string): string[] {
  return s.match(/\s*\S+\s*|\s+/g) || [];
}

/** Normalize a token for equality (ignore surrounding whitespace + case). */
function norm(tok: string): string {
  return tok.trim().toLowerCase();
}

/**
 * Returns the ordered list of segments turning `before` into `after`.
 * Adjacent segments of the same type are merged for compact rendering.
 */
export function wordDiff(before: string, after: string): DiffSegment[] {
  const a = tokenize(stripBold(before));
  const b = tokenize(stripBold(after));

  // LCS length table.
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = norm(a[i]) === norm(b[j])
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  // Backtrack into raw segments.
  const raw: DiffSegment[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (norm(a[i]) === norm(b[j])) {
      raw.push({ value: b[j], type: 'same' });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      raw.push({ value: a[i], type: 'removed' });
      i++;
    } else {
      raw.push({ value: b[j], type: 'added' });
      j++;
    }
  }
  while (i < m) { raw.push({ value: a[i], type: 'removed' }); i++; }
  while (j < n) { raw.push({ value: b[j], type: 'added' }); j++; }

  // Merge adjacent same-type segments.
  const merged: DiffSegment[] = [];
  for (const seg of raw) {
    const last = merged[merged.length - 1];
    if (last && last.type === seg.type) last.value += seg.value;
    else merged.push({ ...seg });
  }
  return merged;
}

/**
 * True when a rewrite is just minor wording — no meaningful enhancement and no
 * concerning loss. Lets the UI/labels avoid calling a trivial edit a real
 * "enhancement", and (inversely) flags when a rewrite quietly DROPPED a keyword.
 *
 * A change counts as NON-cosmetic if either:
 *   - it ADDED a real content word (an actual enhancement), or
 *   - it REMOVED a technical-looking token (Spring Boot, OIC, REST, HMAC, 30% …)
 *     — i.e. a keyword/metric regression we must surface.
 * Pure trimming of filler/grammar words is cosmetic.
 */
const FILLER = new Set([
  'the', 'a', 'an', 'of', 'to', 'and', 'for', 'with', 'in', 'on', 'by', 'that',
  'various', 'significant', 'significantly', 'remarkable', 'remarkably', 'notable',
  'notably', 'overall', 'effectively', 'efficiently', 'efficient', 'seamless',
  'seamlessly', 'innovative', 'proficiently', 'swiftly', 'robust', 'comprehensive',
  'user-friendly', 'high-performance', 'enabling', 'such', 'as',
]);

/** A token that looks like a technology, acronym, or metric — losing it matters. */
function isTechnical(word: string): boolean {
  const w = word.replace(/[.,;:()'"]/g, '');
  if (!w) return false;
  if (/[0-9]/.test(w)) return true;            // metrics / versions (30%, 100k)
  if (/[+#/]/.test(w)) return true;            // C++, CI/CD, .NET-ish
  if (/[A-Z]/.test(w.slice(1))) return true;   // CamelCase / mid-word caps (MCP, OIC)
  if (/^[A-Z]{2,}$/.test(w)) return true;      // all-caps acronyms (SCM, HMAC, REST)
  return false;
}

function isContentWord(word: string): boolean {
  const clean = word.replace(/[^A-Za-z0-9+#./-]/g, '').toLowerCase();
  return !!clean && !FILLER.has(clean);
}

export function isCosmeticOnly(before: string, after: string): boolean {
  const segs = wordDiff(before, after);
  for (const seg of segs) {
    if (seg.type === 'same') continue;
    const words = seg.value.trim().split(/\s+/).filter(Boolean);
    for (const w of words) {
      if (seg.type === 'added') {
        if (isContentWord(w)) return false;    // added real content = enhancement
      } else if (isTechnical(w)) {
        return false;                          // dropped a keyword/metric = regression
      }
    }
  }
  return true;
}
