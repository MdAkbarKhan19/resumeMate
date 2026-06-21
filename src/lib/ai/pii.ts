/**
 * PII redaction for anything sent to a third-party LLM.
 *
 * We never need a candidate's identity to analyze a JD, score a resume, or
 * rewrite a bullet — only the professional content. This strips direct personal
 * identifiers (email, phone, profile/portfolio URLs, and the candidate's own
 * name) from text before it leaves our server, so personal data is not exposed
 * to (or retained/trained on by) the model provider.
 *
 * Design:
 *  - Redaction is one-way and uses stable placeholder tokens.
 *  - The PARSER extracts contact details locally first, redacts them from the
 *    body, sends only the redacted body to the model for structural parsing,
 *    then merges the locally-extracted PII back in. The model never sees them.
 *  - The ENHANCER redacts emails/phones/name from each string it sends; it does
 *    NOT redact generic URLs by default (a project link inside a bullet is
 *    content we must preserve).
 */

export interface RedactOptions {
  emails?: boolean;
  phones?: boolean;
  /** Redact LinkedIn/GitHub/portfolio and other bare URLs. */
  urls?: boolean;
  /** Specific names (e.g. the candidate's own name) to scrub. */
  names?: string[];
}

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
// 7+ digits with common separators — international + local formats.
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/g;
const URL_RE = /\b((?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s)|,]*)?)/gi;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Return `text` with the requested PII categories replaced by placeholder tokens.
 * Safe on undefined/empty input.
 */
export function redactPII(text: string | undefined | null, opts: RedactOptions = {}): string {
  if (!text) return '';
  const { emails = true, phones = true, urls = false, names = [] } = opts;
  let out = text;

  // Names first (before URL/email scrubbing can fragment them).
  for (const raw of names) {
    const name = (raw || '').trim();
    if (name.length < 2) continue;
    // Full name as a phrase…
    out = out.replace(new RegExp(escapeRegExp(name), 'gi'), '[NAME]');
    // …and each multi-char token of it (handles "Jane" appearing alone).
    for (const part of name.split(/\s+/)) {
      if (part.length >= 3) {
        out = out.replace(new RegExp(`\\b${escapeRegExp(part)}\\b`, 'gi'), '[NAME]');
      }
    }
  }

  if (urls) out = out.replace(URL_RE, '[URL]');
  if (emails) out = out.replace(EMAIL_RE, '[EMAIL]');
  if (phones) out = out.replace(PHONE_RE, '[PHONE]');

  return out;
}

/**
 * Redact PII for the ENHANCER: scrub emails, phones and the candidate's own
 * name, but keep URLs (project/portfolio links inside bullets are real content).
 */
export function redactForEnhancement(text: string | undefined | null, candidateName?: string): string {
  return redactPII(text, {
    emails: true,
    phones: true,
    urls: false,
    names: candidateName ? [candidateName] : [],
  });
}

/**
 * Redact PII for the PARSER body. Scrubs emails, phones, the locally-detected
 * name, and the candidate's OWN profile URLs (LinkedIn/GitHub/portfolio) — but
 * leaves generic links (e.g. a project URL inside a bullet) intact so résumé
 * content isn't damaged. Contact details are extracted locally and merged back
 * afterwards, so the model never needs them.
 */
export function redactForParsing(
  text: string | undefined | null,
  opts: { name?: string; personalUrls?: string[] } = {},
): string {
  let out = redactPII(text, {
    emails: true,
    phones: true,
    urls: false,
    names: opts.name ? [opts.name] : [],
  });
  for (const url of opts.personalUrls || []) {
    const v = (url || '').trim();
    if (v.length >= 6) out = out.replace(new RegExp(escapeRegExp(v), 'gi'), '[URL]');
  }
  return out;
}

const PLACEHOLDER_RE = /\[(?:NAME|EMAIL|PHONE|URL)\]/g;

/**
 * Replace redaction placeholders that leaked into model output with the known
 * local values (or clear them). This data returns only to the user's own
 * résumé — it is never sent back to the model — so restoring is safe.
 */
export function restoreRedactions(
  value: any,
  map: { name?: string; email?: string; phone?: string },
): any {
  const repl = (s: string): string =>
    s.replace(PLACEHOLDER_RE, (tok) => {
      if (tok === '[NAME]') return map.name || '';
      if (tok === '[EMAIL]') return map.email || '';
      if (tok === '[PHONE]') return map.phone || '';
      return ''; // [URL] — no single canonical value; clear stray placeholders
    });

  if (typeof value === 'string') return repl(value);
  if (Array.isArray(value)) return value.map((v) => restoreRedactions(v, map));
  if (value && typeof value === 'object') {
    const out: any = {};
    for (const k of Object.keys(value)) out[k] = restoreRedactions(value[k], map);
    return out;
  }
  return value;
}
