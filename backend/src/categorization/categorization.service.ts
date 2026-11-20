import { Injectable, Logger } from '@nestjs/common';
import { CategorizationStore } from '../data/categorization.store';
import { ClientsRepository } from '../data/clients.repository';
import { RawClient } from '../domain/client';
import { BatchCategorizer } from './batch-categorizer';
import {
  CategorizationRunOptions,
  CategorizationRunSummary,
  RecategorizeOptions,
} from './categorization.types';
import { chunk, shuffle } from '../common/sampling';

/** Intentos por transcripción antes de darla por fallida. */
const MAX_ATTEMPTS = 3;

interface Job {
  clients: RawClient[];
  attempt: number;
}

/**
 * Orquesta una corrida de categorización:
 *
 * 1. Toma los clientes aún no categorizados, en orden aleatorio.
 * 2. La divide en lotes y los procesa con N workers concurrentes.
 * 3. Las transcripciones que el modelo no devolvió se reintentan de a una.
 * 4. Guarda cada lote apenas termina (la corrida se puede cortar y retomar).
 */
@Injectable()
export class CategorizationService {
  private readonly logger = new Logger(CategorizationService.name);

  constructor(
    private readonly categorizer: BatchCategorizer,
    private readonly store: CategorizationStore,
    private readonly repository: ClientsRepository,
  ) {}

  /**
   * Clientes sin categorizar, en orden aleatorio: si la corrida se corta
   * a la mitad, lo procesado es una muestra representativa.
   */
  pendingClients(): RawClient[] {
    const pending = this.repository
      .findRaw()
      .filter((c) => !this.store.has(c.id));
    return shuffle(pending);
  }

  /** Categoriza los clientes que aún no tienen categorías (todos, o hasta `limit`). */
  run(options: CategorizationRunOptions): Promise<CategorizationRunSummary> {
    const targets = this.pendingClients().slice(0, options.limit);
    return this.process(targets, options);
  }

  /**
   * Vuelve a categorizar clientes específicos (p. ej. tras corregir el
   * prompt), reemplazando su categorización anterior.
   */
  recategorize(
    ids: readonly string[],
    options: RecategorizeOptions,
  ): Promise<CategorizationRunSummary> {
    const wanted = new Set(ids);
    const targets = this.repository.findRaw().filter((c) => wanted.has(c.id));
    const unknown = ids.filter((id) => !targets.some((c) => c.id === id));
    if (unknown.length) {
      throw new Error(`Clientes no encontrados: ${unknown.join(', ')}`);
    }
    return this.process(targets, options);
  }

  private async process(
    targets: RawClient[],
    options: RecategorizeOptions,
  ): Promise<CategorizationRunSummary> {
    const startedAt = Date.now();
    const queue: Job[] = chunk(targets, options.batchSize).map((clients) => ({
      clients,
      attempt: 1,
    }));
    const progress = { categorized: 0, failed: 0 };

    this.logger.log(
      `Categorizando ${targets.length} clientes con ${this.categorizer.model} ` +
        `(lotes de ${options.batchSize}, concurrencia ${options.concurrency})`,
    );

    const worker = async () => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        const { records, missing } = await this.categorizer.categorize(
          job.clients,
        );
        const saved = Object.keys(records).length;
        if (saved) await this.store.saveMany(records);
        progress.categorized += saved;

        if (missing.length && job.attempt < MAX_ATTEMPTS) {
          // Reintento individual: aísla la transcripción problemática.
          const nextAttempt = job.attempt + 1;
          queue.push(
            ...missing.map((c) => ({ clients: [c], attempt: nextAttempt })),
          );
        } else {
          progress.failed += missing.length;
        }
        this.logProgress(progress, targets.length, startedAt);
      }
    };

    await Promise.all(Array.from({ length: options.concurrency }, worker));

    return {
      requested: targets.length,
      categorized: progress.categorized,
      failed: progress.failed,
      totalCategorized: this.store.size,
      durationMs: Date.now() - startedAt,
    };
  }

  private logProgress(
    { categorized, failed }: { categorized: number; failed: number },
    total: number,
    startedAt: number,
  ): void {
    const processed = categorized + failed;
    const elapsedSeconds = (Date.now() - startedAt) / 1000;
    const etaSeconds = processed
      ? Math.round((elapsedSeconds / processed) * (total - processed))
      : 0;
    this.logger.log(
      `Progreso ${processed}/${total} (ok ${categorized}, fallidos ${failed}) · ETA ${etaSeconds}s`,
    );
  }
}
