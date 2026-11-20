import { Logger } from '@nestjs/common';
import { sleep } from '../../common/async';
import { RateLimiter } from '../../common/rate-limiter';
import { LlmProvider, LlmRateLimitError, LlmResult } from './llm-provider';

const MAX_RATE_LIMIT_WAITS = 20;

/**
 * Decorator que agrega control de cuota a cualquier `LlmProvider`:
 * espacia las requests según el RPM configurado y, si el proveedor
 * responde 429, pausa a todos los workers el tiempo que indique.
 */
export class RateLimitedLlmProvider implements LlmProvider {
  private readonly logger = new Logger(RateLimitedLlmProvider.name);
  private readonly limiter: RateLimiter;

  constructor(
    private readonly inner: LlmProvider,
    rpm: number,
  ) {
    this.limiter = new RateLimiter(rpm);
  }

  get model(): string {
    return this.inner.model;
  }

  async generate(prompt: string): Promise<LlmResult> {
    for (let waits = 0; ; waits++) {
      await this.limiter.acquire();
      try {
        return await this.inner.generate(prompt);
      } catch (error) {
        const canWait =
          error instanceof LlmRateLimitError && waits < MAX_RATE_LIMIT_WAITS;
        if (!canWait) throw error;

        const seconds = Math.round(error.retryAfterMs / 1000);
        this.logger.warn(`Rate limit alcanzado, esperando ${seconds}s`);
        this.limiter.pause(error.retryAfterMs);
        await sleep(error.retryAfterMs);
      }
    }
  }
}
