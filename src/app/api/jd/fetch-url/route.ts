import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const fetchUrlSchema = z.object({
  url: z.string().url(),
});

// Hosts where we know the JD lives on a public page.
// Keep this list tight — only sites we've actually tested.
const ALLOWED_HOSTS = new Set([
  'linkedin.com',
  'www.linkedin.com',
  'in.linkedin.com',
  'naukri.com',
  'www.naukri.com',
  'm.naukri.com',
  'indeed.com',
  'www.indeed.com',
  'in.indeed.com',
  'indeed.co.in',
  'www.indeed.co.in',
]);

const FETCH_TIMEOUT_MS = 10_000;
const MAX_BYTES = 1_500_000; // 1.5 MB — these pages are big with inline JS
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

interface ParsedJD {
  title?: string;
  company?: string;
  location?: string;
  description: string;
}

function normalizeHost(urlStr: string): { host: string; canonical: string } | null {
  try {
    const u = new URL(urlStr);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    return { host: u.hostname.toLowerCase(), canonical: u.toString() };
  } catch {
    return null;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// LinkedIn/Indeed embed JSON-LD JobPosting; Naukri sometimes does too.
// Extract every <script type="application/ld+json"> block and find the JobPosting.
function extractFromJsonLd(html: string): ParsedJD | null {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    const raw = match[1].trim();
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    const nodes = Array.isArray(parsed) ? parsed : [parsed];
    for (const node of nodes) {
      const type = node?.['@type'];
      const isJobPosting =
        type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'));
      if (!isJobPosting) continue;

      const description = typeof node.description === 'string' ? stripHtml(node.description) : '';
      if (!description || description.length < 50) continue;

      const company =
        typeof node.hiringOrganization === 'string'
          ? node.hiringOrganization
          : node.hiringOrganization?.name;

      const locNode = Array.isArray(node.jobLocation) ? node.jobLocation[0] : node.jobLocation;
      const addr = locNode?.address;
      const location =
        typeof addr === 'string'
          ? addr
          : [addr?.addressLocality, addr?.addressRegion, addr?.addressCountry]
              .filter(Boolean)
              .join(', ') || undefined;

      return {
        title: typeof node.title === 'string' ? node.title : undefined,
        company: typeof company === 'string' ? company : undefined,
        location: location || undefined,
        description,
      };
    }
  }
  return null;
}

// LinkedIn guest job view (linkedin.com/jobs/view/<id>) ships the JD as raw
// HTML inside .show-more-less-html__markup. No JSON-LD on this surface, so
// we read the markup directly. Title/company come from the topcard nodes.
function extractLinkedInFallback(html: string): ParsedJD | null {
  const descMatch = html.match(
    /<div[^>]+class="[^"]*show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<(?:button|div|section)/i,
  );
  if (!descMatch) return null;
  const description = stripHtml(descMatch[1]);
  if (description.length < 100) return null;

  const titleEl =
    html.match(/<h1[^>]*class="[^"]*top-card-layout__title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) ||
    html.match(/<h1[^>]*class="[^"]*topcard__title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i);
  const companyEl =
    html.match(/<a[^>]*class="[^"]*topcard__org-name-link[^"]*"[^>]*>([\s\S]*?)<\/a>/i) ||
    html.match(/<span[^>]*class="[^"]*topcard__flavor[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
  const locationEl = html.match(
    /<span[^>]*class="[^"]*topcard__flavor--bullet[^"]*"[^>]*>([\s\S]*?)<\/span>/i,
  );

  return {
    title: titleEl ? stripHtml(titleEl[1]) : undefined,
    company: companyEl ? stripHtml(companyEl[1]) : undefined,
    location: locationEl ? stripHtml(locationEl[1]) : undefined,
    description,
  };
}

// Naukri-specific fallback: their JD HTML uses a known class.
function extractNaukriFallback(html: string): ParsedJD | null {
  const titleMatch = html.match(/<h1[^>]*class="[^"]*styles_jd-header-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i)
    || html.match(/<title>([\s\S]*?)<\/title>/i);
  const descMatch = html.match(
    /<div[^>]+class="[^"]*styles_JDC__dang-inner-html[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  );
  if (!descMatch) return null;
  const description = stripHtml(descMatch[1]);
  if (description.length < 100) return null;
  return {
    title: titleMatch ? stripHtml(titleMatch[1]) : undefined,
    description,
  };
}

async function fetchPage(url: string): Promise<{ html: string; finalUrl: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-IN,en-US;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!res.ok) {
      throw new Error(`Upstream returned ${res.status}`);
    }

    // Stream-read with a byte cap so a huge page can't OOM the server.
    const reader = res.body?.getReader();
    if (!reader) {
      const txt = await res.text();
      return { html: txt.slice(0, MAX_BYTES), finalUrl: res.url };
    }
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_BYTES) {
        await reader.cancel();
        break;
      }
      chunks.push(value);
    }
    const buf = Buffer.concat(chunks.map((c) => Buffer.from(c)));
    return { html: buf.toString('utf-8'), finalUrl: res.url };
  } finally {
    clearTimeout(timer);
  }
}

async function handleFetchUrl(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_BODY', message: 'Invalid JSON body' } },
      { status: 400 },
    );
  }

  const parsed = fetchUrlSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'A valid URL is required' },
      },
      { status: 400 },
    );
  }

  const normalized = normalizeHost(parsed.data.url);
  if (!normalized) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_URL', message: 'URL could not be parsed' } },
      { status: 400 },
    );
  }

  // Strip subdomains beyond what we whitelist by checking endsWith on the suffix.
  const allowed = Array.from(ALLOWED_HOSTS).some(
    (h) => normalized.host === h || normalized.host.endsWith('.' + h),
  );
  if (!allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNSUPPORTED_HOST',
          message: 'Only LinkedIn, Naukri, and Indeed links are supported. Paste the JD text instead.',
        },
      },
      { status: 400 },
    );
  }

  let html: string;
  try {
    const result = await fetchPage(normalized.canonical);
    html = result.html;
    // Re-validate the host AFTER redirects: a whitelisted page could 302 to an
    // internal/metadata address (SSRF). If the final URL left the allowlist,
    // refuse to return its contents.
    const finalHost = normalizeHost(result.finalUrl)?.host;
    const finalAllowed =
      !!finalHost &&
      Array.from(ALLOWED_HOSTS).some((h) => finalHost === h || finalHost.endsWith('.' + h));
    if (!finalAllowed) {
      return NextResponse.json(
        { success: false, error: { code: 'UNSUPPORTED_HOST', message: 'This link redirected somewhere we don\'t support. Paste the JD text instead.' } },
        { status: 400 },
      );
    }
  } catch (err: any) {
    const isAbort = err?.name === 'AbortError';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: isAbort ? 'FETCH_TIMEOUT' : 'FETCH_FAILED',
          message: isAbort
            ? 'The job site took too long to respond. Please paste the JD text instead.'
            : 'Could not fetch the job page. Please paste the JD text instead.',
        },
      },
      { status: 502 },
    );
  }

  // LinkedIn login walls return a small HTML page with no JobPosting JSON-LD.
  if (html.length < 5000 && /authwall|sign in|login/i.test(html)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'LOGIN_WALL',
          message:
            "This LinkedIn job is gated behind a sign-in. Open it in your browser, copy the description, and paste it here.",
        },
      },
      { status: 422 },
    );
  }

  let result = extractFromJsonLd(html);
  if (!result && normalized.host.includes('linkedin')) {
    result = extractLinkedInFallback(html);
  }
  if (!result && normalized.host.includes('naukri')) {
    result = extractNaukriFallback(html);
  }

  if (!result || !result.description || result.description.length < 100) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PARSE_FAILED',
          message:
            "We couldn't extract the job description from this page. Please paste the JD text instead.",
        },
      },
      { status: 422 },
    );
  }

  // Cap description so a runaway page can't blow up downstream AI calls.
  const MAX_DESC = 25_000;
  const description =
    result.description.length > MAX_DESC ? result.description.slice(0, MAX_DESC) : result.description;

  return NextResponse.json({
    success: true,
    data: {
      title: result.title?.slice(0, 200),
      company: result.company?.slice(0, 200),
      location: result.location?.slice(0, 200),
      description,
      source: normalized.host,
    },
  });
}

export const POST = withAuth(handleFetchUrl);
