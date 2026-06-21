/**
 * Centralized LLM client + model router.
 *
 * One place decides WHICH provider/model a given job runs on, so model choice
 * is an env switch, not a code change scattered across a dozen call sites.
 *
 * Two tiers:
 *   - 'cheap'   → high-volume, low-stakes structured work (resume parse, JD
 *                 extraction, skills/summary/projects). Default: DeepSeek V4 Flash.
 *   - 'quality' → the believability-critical rewrite + reflection on experience
 *                 bullets. Default: DeepSeek V4 Pro.
 *
 * DeepSeek exposes an OpenAI-compatible Chat Completions API, so the same
 * `openai` SDK drives both providers — only baseURL + key + model differ.
 *
 * Safety: if the configured provider has no API key set, we fall back to
 * whichever provider DOES have a key (so a half-configured prod box keeps
 * serving on OpenAI until DEEPSEEK_API_KEY is added, then switches itself).
 */

import OpenAI from 'openai';

export type AITier = 'cheap' | 'quality';
export type AIProvider = 'deepseek' | 'openai';

export interface ModelPricing {
  /** USD per 1M input (cache-miss) tokens */
  inputPerM: number;
  /** USD per 1M cached-input tokens */
  cachedInputPerM: number;
  /** USD per 1M output tokens */
  outputPerM: number;
}

export interface ResolvedLLM {
  client: OpenAI;
  model: string;
  provider: AIProvider;
  pricing: ModelPricing;
}

export interface LLMUsage {
  /** total tokens (prompt + completion) across one or more calls */
  tokensUsed: number;
  /** estimated USD cost across those calls */
  cost: number;
}

// ---- Pricing table (USD / 1M tokens). Verified Jun 2026. ----
// DeepSeek V4 Flash/Pro: https://api-docs.deepseek.com/quick_start/pricing
// OpenAI gpt-4o(-mini):  https://developers.openai.com/api/docs/pricing
const PRICING: Record<string, ModelPricing> = {
  'deepseek-v4-flash': { inputPerM: 0.14, cachedInputPerM: 0.0028, outputPerM: 0.28 },
  'deepseek-chat':     { inputPerM: 0.14, cachedInputPerM: 0.0028, outputPerM: 0.28 }, // V4 Flash alias
  'deepseek-reasoner': { inputPerM: 0.14, cachedInputPerM: 0.0028, outputPerM: 0.28 }, // V4 Flash thinking
  'deepseek-v4-pro':   { inputPerM: 1.74, cachedInputPerM: 0.0145, outputPerM: 3.48 },
  'gpt-4o-mini':       { inputPerM: 0.15, cachedInputPerM: 0.075, outputPerM: 0.60 },
  'gpt-4o':            { inputPerM: 2.50, cachedInputPerM: 1.25, outputPerM: 10.0 },
};

const DEFAULT_PRICING: ModelPricing = PRICING['gpt-4o-mini'];

export function priceFor(model: string): ModelPricing {
  const key = model.toLowerCase().trim();
  if (PRICING[key]) return PRICING[key];
  // Prefix match so "deepseek-v4-pro-0626"-style dated ids still resolve.
  for (const known of Object.keys(PRICING)) {
    if (key.startsWith(known)) return PRICING[known];
  }
  return DEFAULT_PRICING;
}

function deepseekKey(): string | undefined {
  return process.env.DEEPSEEK_API_KEY || process.env.AI_API_KEY || undefined;
}

function openaiKey(): string | undefined {
  return process.env.OPENAI_API_KEY || undefined;
}

/**
 * Decide which provider to actually use. Honors AI_PROVIDER when that provider
 * has a key; otherwise falls back to whichever provider is configured so the
 * app never hard-fails just because the preferred key isn't set yet.
 */
function resolveProvider(): AIProvider {
  const want = (process.env.AI_PROVIDER || 'deepseek').toLowerCase();
  if (want === 'deepseek' && deepseekKey()) return 'deepseek';
  if (want === 'openai' && openaiKey()) return 'openai';
  // Preferred provider's key missing — fall back to any configured provider.
  if (deepseekKey()) return 'deepseek';
  if (openaiKey()) return 'openai';
  // Nothing configured; return the wanted provider so the SDK throws a clear
  // "missing api key" error at call time rather than us guessing.
  return want === 'openai' ? 'openai' : 'deepseek';
}

function modelFor(provider: AIProvider, tier: AITier): string {
  if (provider === 'deepseek') {
    return tier === 'quality'
      ? process.env.DEEPSEEK_QUALITY_MODEL || 'deepseek-v4-pro'
      : process.env.DEEPSEEK_CHEAP_MODEL || 'deepseek-chat';
  }
  // openai
  if (tier === 'quality') {
    return process.env.OPENAI_QUALITY_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }
  return process.env.OPENAI_CHEAP_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';
}

// One client per provider, lazily constructed and cached.
const clientCache = new Map<AIProvider, OpenAI>();

function clientFor(provider: AIProvider): OpenAI {
  const cached = clientCache.get(provider);
  if (cached) return cached;

  let client: OpenAI;
  if (provider === 'deepseek') {
    const apiKey = deepseekKey();
    if (!apiKey) throw new Error('DEEPSEEK_API_KEY (or AI_API_KEY) is not configured');
    client = new OpenAI({
      apiKey,
      baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    });
  } else {
    const apiKey = openaiKey();
    if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
    client = new OpenAI({ apiKey });
  }
  clientCache.set(provider, client);
  return client;
}

/**
 * Resolve the client + model + pricing for a tier of work.
 * Call at request time (not module load) so env is fully populated.
 */
export function getLLM(tier: AITier): ResolvedLLM {
  const provider = resolveProvider();
  const model = modelFor(provider, tier);
  return { client: clientFor(provider), model, provider, pricing: priceFor(model) };
}

/**
 * Estimate USD cost from an OpenAI/DeepSeek `usage` object, accounting for
 * cached-prompt discounts when the provider reports them.
 */
export function costFromUsage(model: string, usage: any): number {
  if (!usage) return 0;
  const pricing = priceFor(model);
  const prompt = usage.prompt_tokens || 0;
  const completion = usage.completion_tokens || 0;
  // DeepSeek reports prompt_cache_hit_tokens; OpenAI reports
  // prompt_tokens_details.cached_tokens. Support both.
  const cachedHit =
    usage.prompt_cache_hit_tokens ??
    usage.prompt_tokens_details?.cached_tokens ??
    0;
  const cachedMiss = Math.max(0, prompt - cachedHit);
  return (
    (cachedMiss * pricing.inputPerM +
      cachedHit * pricing.cachedInputPerM +
      completion * pricing.outputPerM) /
    1_000_000
  );
}

/** Fold one response's usage into a running accumulator. */
export function accrue(acc: LLMUsage, model: string, usage: any): void {
  if (!usage) return;
  acc.tokensUsed += usage.total_tokens || 0;
  acc.cost += costFromUsage(model, usage);
}

export function emptyUsage(): LLMUsage {
  return { tokensUsed: 0, cost: 0 };
}
