/**
 * Heuristic (no-AI) resume parser.
 *
 * Pure, dependency-free fallback used when the OpenAI parse step is unavailable
 * (bad/expired key, quota exhausted, network blip). It will never throw and
 * always returns an object in the SAME shape the OpenAI parser produces, so the
 * downstream `ResumeParserService.extract*` methods consume it unchanged.
 *
 * The goal is "lose nothing, give the user a head start" — not perfect
 * structuring. We pull out contact details + an obvious skills block, and
 * preserve the COMPLETE raw text in a single custom section so the user can
 * move content into the right fields in the builder. Once a valid OpenAI key is
 * configured, the AI path takes over again automatically.
 */

export interface HeuristicParsedResume {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
    portfolio: string;
    title: string;
  };
  summary: string;
  experience: any[];
  education: any[];
  skills: Array<{ category: string; items: string[] }>;
  projects: any[];
  certifications: any[];
  languages: any[];
  volunteer: any[];
  awards: any[];
  publications: any[];
  customSections: Array<{ title: string; content: string }>;
  metadata: {
    detectedSections: string[];
    layoutType: string;
    hasPhoto: boolean;
    totalPages: number;
    usedFallback: true;
  };
}

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
// Matches most international + local phone formats with 7+ digits.
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s)|,]+/i;
const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s)|,]+/i;
const URL_RE = /(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s)|,]*)?/i;
// "City, ST" or "City, Country"
const LOCATION_RE = /\b([A-Z][a-zA-Z.]+(?:\s[A-Z][a-zA-Z.]+)*),\s*([A-Z]{2}|[A-Z][a-zA-Z]+)\b/;

const SKILLS_HEADER_RE = /^\s*(technical skills|core competencies|skills|technologies|tech stack)\s*:?\s*$/i;
const SUMMARY_HEADER_RE = /^\s*(summary|professional summary|profile|objective|about)\s*:?\s*$/i;
const SECTION_HEADER_RE = /^\s*(experience|work experience|employment|education|projects|certifications|awards|languages|volunteer|publications|interests|references)\b/i;

function looksLikeName(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 60) return false;
  if (EMAIL_RE.test(t) || PHONE_RE.test(t) || /https?:|@|\d{4}/.test(t)) return false;
  const words = t.split(/\s+/);
  if (words.length < 1 || words.length > 5) return false;
  // Mostly alphabetic words (allow hyphens, apostrophes, periods).
  return words.every((w) => /^[A-Za-z][A-Za-z'.-]*$/.test(w));
}

/** Split a skills blob on common delimiters and tidy up. */
function splitSkills(blob: string): string[] {
  return blob
    .split(/[,;|•·•\n\t]+/)
    .map((s) => s.replace(/^[-–—\s]+|[-–—\s]+$/g, '').trim())
    .filter((s) => s.length > 0 && s.length <= 60)
    .slice(0, 60);
}

export function heuristicParseResume(rawText: string): HeuristicParsedResume {
  const text = (rawText || '').replace(/\r\n/g, '\n');
  const lines = text.split('\n');
  const nonEmpty = lines.map((l) => l.trim()).filter((l) => l.length > 0);

  const email = (text.match(EMAIL_RE)?.[0] || '').trim();
  const phone = (text.match(PHONE_RE)?.[0] || '').trim();
  const linkedin = (text.match(LINKEDIN_RE)?.[0] || '').trim();
  const github = (text.match(GITHUB_RE)?.[0] || '').trim();

  // Portfolio: first URL that isn't linkedin/github/an email domain.
  let portfolio = '';
  const urlMatches = text.match(new RegExp(URL_RE, 'gi')) || [];
  for (const u of urlMatches) {
    if (/linkedin\.com|github\.com/i.test(u)) continue;
    if (email && u.includes(email.split('@')[1] || '___')) continue;
    portfolio = u.trim();
    break;
  }

  // Name: first line in the top of the document that looks like a person's name.
  let name = '';
  for (const line of nonEmpty.slice(0, 6)) {
    if (looksLikeName(line)) {
      name = line.trim();
      break;
    }
  }

  const location = (text.match(LOCATION_RE)?.[0] || '').trim();

  // Skills + summary blocks: scan for their headers and grab following lines
  // until the next recognised section header / blank gap.
  let skillsItems: string[] = [];
  let summary = '';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (SKILLS_HEADER_RE.test(line)) {
      const collected: string[] = [];
      for (let j = i + 1; j < lines.length && collected.length < 12; j++) {
        const l = lines[j].trim();
        if (!l) { if (collected.length) break; else continue; }
        if (SECTION_HEADER_RE.test(l) || SUMMARY_HEADER_RE.test(l)) break;
        collected.push(l);
      }
      skillsItems = splitSkills(collected.join('\n'));
    } else if (SUMMARY_HEADER_RE.test(line) && !summary) {
      const collected: string[] = [];
      for (let j = i + 1; j < lines.length && collected.length < 8; j++) {
        const l = lines[j].trim();
        if (!l) { if (collected.length) break; else continue; }
        if (SECTION_HEADER_RE.test(l) || SKILLS_HEADER_RE.test(l)) break;
        collected.push(l);
      }
      summary = collected.join(' ').trim();
    }
  }

  return {
    personalInfo: { name, email, phone, location, linkedin, github, portfolio, title: '' },
    summary,
    experience: [],
    education: [],
    skills: skillsItems.length ? [{ category: 'Skills', items: skillsItems }] : [],
    projects: [],
    certifications: [],
    languages: [],
    volunteer: [],
    awards: [],
    publications: [],
    // Preserve EVERYTHING so no data is lost when AI parsing is unavailable.
    customSections: text.trim()
      ? [{
          title: 'Imported Resume (review & organise)',
          content: text.trim(),
        }]
      : [],
    metadata: {
      detectedSections: [],
      layoutType: 'single-column',
      hasPhoto: false,
      totalPages: 1,
      usedFallback: true,
    },
  };
}
