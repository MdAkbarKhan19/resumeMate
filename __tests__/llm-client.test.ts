/**
 * LLM client / model-router tests.
 *
 * Cover the cost math (used for profitability tracking) and the provider/model
 * resolution (cheap tier = DeepSeek V4 Flash, quality tier = DeepSeek V4 Pro,
 * with a safe fallback to OpenAI when DeepSeek isn't configured).
 */

import { priceFor, costFromUsage, accrue, emptyUsage, getLLM } from '@/lib/ai/llm-client';

describe('priceFor', () => {
  test('resolves known models', () => {
    expect(priceFor('deepseek-v4-pro').outputPerM).toBe(3.48);
    expect(priceFor('deepseek-chat').inputPerM).toBe(0.14);
    expect(priceFor('gpt-4o-mini').outputPerM).toBe(0.6);
  });

  test('prefix-matches dated model ids', () => {
    expect(priceFor('deepseek-v4-pro-2026').outputPerM).toBe(3.48);
  });

  test('falls back to a sane default for unknown models', () => {
    expect(priceFor('some-future-model')).toEqual(priceFor('gpt-4o-mini'));
  });
});

describe('costFromUsage', () => {
  test('prices input + output per million', () => {
    const cost = costFromUsage('deepseek-chat', {
      prompt_tokens: 1_000_000,
      completion_tokens: 1_000_000,
    });
    // 0.14 (in) + 0.28 (out)
    expect(cost).toBeCloseTo(0.42, 6);
  });

  test('applies the cache-hit discount when reported (DeepSeek shape)', () => {
    const cost = costFromUsage('deepseek-chat', {
      prompt_tokens: 1_000_000,
      prompt_cache_hit_tokens: 1_000_000,
      completion_tokens: 0,
    });
    expect(cost).toBeCloseTo(0.0028, 6); // fully cached input
  });

  test('applies the cache-hit discount in the OpenAI usage shape', () => {
    const cost = costFromUsage('gpt-4o-mini', {
      prompt_tokens: 1_000_000,
      prompt_tokens_details: { cached_tokens: 1_000_000 },
      completion_tokens: 0,
    });
    expect(cost).toBeCloseTo(0.075, 6);
  });

  test('returns 0 for missing usage', () => {
    expect(costFromUsage('deepseek-chat', undefined)).toBe(0);
  });
});

describe('accrue', () => {
  test('accumulates tokens and cost across calls', () => {
    const u = emptyUsage();
    accrue(u, 'deepseek-chat', { prompt_tokens: 1000, completion_tokens: 500, total_tokens: 1500 });
    accrue(u, 'deepseek-chat', { prompt_tokens: 1000, completion_tokens: 500, total_tokens: 1500 });
    expect(u.tokensUsed).toBe(3000);
    expect(u.cost).toBeGreaterThan(0);
  });
});

describe('getLLM provider resolution', () => {
  const ENV = { ...process.env };
  afterEach(() => {
    process.env = { ...ENV };
  });

  test('routes the quality tier to DeepSeek V4 Pro when DeepSeek is configured', () => {
    process.env.AI_PROVIDER = 'deepseek';
    process.env.DEEPSEEK_API_KEY = 'sk-test';
    const { provider, model } = getLLM('quality');
    expect(provider).toBe('deepseek');
    expect(model).toBe('deepseek-v4-pro');
  });

  test('routes the cheap tier to DeepSeek V4 Flash', () => {
    process.env.AI_PROVIDER = 'deepseek';
    process.env.DEEPSEEK_API_KEY = 'sk-test';
    const { model } = getLLM('cheap');
    expect(model).toBe('deepseek-chat');
  });

  test('falls back to OpenAI when DeepSeek key is absent', () => {
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.AI_API_KEY;
    process.env.AI_PROVIDER = 'deepseek';
    process.env.OPENAI_API_KEY = 'sk-openai';
    const { provider, model } = getLLM('cheap');
    expect(provider).toBe('openai');
    expect(model).toBe('gpt-4o-mini');
  });
});
