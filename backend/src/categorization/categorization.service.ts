import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../config/env';
import { CategorizationStore } from '../data/categorization.store';
import { CategorizationRecord, RawClient } from '../data/client.model';
import { ClientsRepository } from '../data/clients.repository';
import { LLM_PROVIDER, LlmRateLimitError } from './llm/llm-provider';
import type { LlmProvider, LlmResult } from './llm/llm-provider';
import { buildCategorizationPrompt } from './prompt';
import { RateLimiter, sleep } from './rate-limiter';
import { parseBatchResponse } from './response-parser';
import { chunk, seededShuffle } from './sampling';

export interface CategorizationRunOptions {
  /** Cuántos clientes pendientes categorizar en esta corrida. */
  limit: number;
  /** Transcripciones por request al LLM. */
  batchSize: number;
  /** Requests en vuelo simultáneamente. */
  concurrency: number;
  /** Semilla de la muestra aleatoria. */
  seed: number;
}

export interface CategorizationRunSummary {
  requested: number;
  categorized: number;
  failed: number;
  totalCategorized: number;
  durationMs: number;
}

const MAX_ATTEMPTS = 3;
const MAX_RATE_LIMIT_WAITS = 20;

interface Job {
  clients: RawClient[];
  attempt: number;
}

@Injectable()
export class CategorizationService {
  private readonly logger = new Logger(CategorizationService.name);
  private readonly limiter: RateLimiter;

  constructor(
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
    private readonly store: CategorizationStore,
    private readonly repository: ClientsRepository,
    config: ConfigService<Env, true>,
  ) {
    this.limiter = new RateLimiter(config.get('LLM_RPM', { infer: true }));
  }

  /** Clientes sin categorizar, en orden aleatorio reproducible. */
  pendingClients(seed: number): RawClient[] {
    const pending = this.repository
      .findRaw()
      .filter((c) => !this.store.has(c.id));
    return seededShuffle(pending, seed);
  }

  async run(
    options: CategorizationRunOptions,
  ): Promise<CategorizationRunSummary> {
    const started = Date.now();
    const targets = this.pendingClients(options.seed).slice(0, options.limit);
    const queue: Job[] = chunk(targets, options.batchSize).map((clients) => ({
      clients,
      attempt: 1,
    }));

    let categorized = 0;
    let failed = 0;
    this.logger.log(
      `Categorizando ${targets.length} clientes con ${this.llm.model} ` +
        `(lotes de ${options.batchSize}, concurrencia ${options.concurrency})`,
    );

    const worker = async () => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        const { saved, missing } = await this.processJob(job);
        categorized += saved;

        if (missing.length && job.attempt < MAX_ATTEMPTS) {
          // Reintento individual: aísla la transcripción problemática.
          queue.push(
            ...missing.map((c) => ({ clients: [c], attempt: job.attempt + 1 })),
          );
        } else {
          failed += missing.length;
        }
        this.logProgress(categorized, failed, targets.length, started);
      }
    };

    await Promise.all(Array.from({ length: options.concurrency }, worker));

    return {
      requested: targets.length,
      categorized,
      failed,
      totalCategorized: this.store.size,
      durationMs: Date.now() - started,
    };
  }

  private async processJob(
    job: Job,
  ): Promise<{ saved: number; missing: RawClient[] }> {
    const byRef = new Map(job.clients.map((c, i) => [i + 1, c]));
    const prompt = buildCategorizationPrompt(
      job.clients.map((c, i) => ({ ref: i + 1, transcript: c.transcript })),
    );

    let response: LlmResult;
    try {
      response = await this.generateWithRateLimit(prompt);
    } catch (error) {
      this.logger.warn(`Error del LLM: ${(error as Error).message}`);
      return { saved: 0, missing: job.clients };
    }

    let parsed: ReturnType<typeof parseBatchResponse> = [];
    try {
      parsed = parseBatchResponse(response.text);
    } catch (error) {
      this.logger.warn(`Respuesta no parseable: ${(error as Error).message}`);
    }

    const records: Record<string, CategorizationRecord> = {};
    const now = new Date().toISOString();
    for (const item of parsed) {
      const client = byRef.get(item.ref);
      if (!client) continue;
      records[client.id] = {
        categories: item.categories,
        model: response.model,
        categorizedAt: now,
      };
      byRef.delete(item.ref);
    }

    const saved = Object.keys(records).length;
    if (saved) await this.store.saveMany(records);
    return { saved, missing: [...byRef.values()] };
  }

  private async generateWithRateLimit(prompt: string): Promise<LlmResult> {
    for (let waits = 0; ; waits++) {
      await this.limiter.acquire();
      try {
        return await this.llm.generate(prompt);
      } catch (error) {
        if (
          !(error instanceof LlmRateLimitError) ||
          waits >= MAX_RATE_LIMIT_WAITS
        ) {
          throw error;
        }
        this.logger.warn(
          `Rate limit alcanzado, esperando ${Math.round(error.retryAfterMs / 1000)}s`,
        );
        this.limiter.pause(error.retryAfterMs);
        await sleep(error.retryAfterMs);
      }
    }
  }

  private logProgress(
    done: number,
    failed: number,
    total: number,
    started: number,
  ): void {
    const processed = done + failed;
    const elapsed = (Date.now() - started) / 1000;
    const eta = processed
      ? Math.round((elapsed / processed) * (total - processed))
      : 0;
    this.logger.log(
      `Progreso ${processed}/${total} (ok ${done}, fallidos ${failed}) · ETA ${eta}s`,
    );
  }
}
