/**
 * Base Agent - Abstract class for all specialized agents
 * Provides common OpenAI client, error handling, retry logic, and token tracking
 */

import OpenAI from 'openai';
import { AgentResult, AgentName, ProgressCallback } from './types';
import { getLLM } from '@/lib/ai/llm-client';

export abstract class BaseAgent<TInput, TOutput> {
  protected name: AgentName;
  protected client: OpenAI;
  protected model: string;
  protected maxRetries: number;
  protected onProgress?: ProgressCallback;

  constructor(name: AgentName, options?: { model?: string; maxRetries?: number }) {
    this.name = name;
    const llm = getLLM('cheap');
    this.client = llm.client;
    this.model = options?.model || llm.model;
    this.maxRetries = options?.maxRetries ?? 2;
  }

  setProgressCallback(cb: ProgressCallback): void {
    this.onProgress = cb;
  }

  protected emitProgress(message: string, progress?: number): void {
    this.onProgress?.({
      agent: this.name,
      status: 'running',
      message,
      progress,
    });
  }

  protected emitComplete(message: string, data?: unknown): void {
    this.onProgress?.({
      agent: this.name,
      status: 'complete',
      message,
      progress: 100,
      data,
    });
  }

  protected emitError(message: string): void {
    this.onProgress?.({
      agent: this.name,
      status: 'error',
      message,
    });
  }

  /**
   * Execute the agent with retry logic
   */
  async run(input: TInput): Promise<AgentResult<TOutput>> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          this.emitProgress(`Retry attempt ${attempt}/${this.maxRetries}...`);
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        }

        const result = await this.execute(input);
        const durationMs = Date.now() - startTime;

        this.emitComplete(`Completed in ${(durationMs / 1000).toFixed(1)}s`);

        return {
          success: true,
          data: result.data,
          tokensUsed: result.tokensUsed,
          durationMs,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on auth errors or invalid input
        if (this.isNonRetryableError(lastError)) {
          break;
        }
      }
    }

    const durationMs = Date.now() - startTime;
    const errorMessage = lastError?.message || 'Unknown error';
    this.emitError(errorMessage);

    return {
      success: false,
      error: errorMessage,
      tokensUsed: 0,
      durationMs,
    };
  }

  /**
   * Core execution logic - implemented by each specialized agent
   */
  protected abstract execute(input: TInput): Promise<{ data: TOutput; tokensUsed: number }>;

  /**
   * Call OpenAI with JSON response format
   */
  protected async callLLM(params: {
    systemPrompt: string;
    userPrompt: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ content: string; tokensUsed: number }> {
    const response = await this.client.chat.completions.create({
      model: params.model || this.model,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userPrompt },
      ],
      temperature: params.temperature ?? 0.3,
      max_tokens: params.maxTokens ?? 2000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    const tokensUsed = response.usage?.total_tokens || 0;

    return { content, tokensUsed };
  }

  /**
   * Call OpenAI without JSON format constraint (for text responses)
   */
  protected async callLLMText(params: {
    systemPrompt: string;
    userPrompt: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ content: string; tokensUsed: number }> {
    const response = await this.client.chat.completions.create({
      model: params.model || this.model,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userPrompt },
      ],
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 500,
    });

    const content = response.choices[0]?.message?.content || '';
    const tokensUsed = response.usage?.total_tokens || 0;

    return { content, tokensUsed };
  }

  private isNonRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('api key') ||
      message.includes('authentication') ||
      message.includes('invalid_api_key') ||
      message.includes('insufficient_quota')
    );
  }
}
