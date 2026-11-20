import { Inject, Injectable, Logger } from '@nestjs/common';
import { CategorizationRecord, RawClient } from '../domain/client';
import { LLM_PROVIDER } from './llm/llm-provider';
import type { LlmProvider } from './llm/llm-provider';
import { ParsedItem, parseBatchResponse } from './parsing/response-parser';
import { buildCategorizationPrompt } from './prompt/categorization.prompt';

export interface BatchResult {
  /** Categorizaciones válidas, indexadas por id de cliente. */
  records: Record<string, CategorizationRecord>;
  /** Clientes que el modelo no devolvió o devolvió inválidos. */
  missing: RawClient[];
}

/**
 * Categoriza un lote de clientes en una sola llamada al LLM.
 * Cada transcripción se identifica con un `ref` (1..n) para emparejar
 * la respuesta del modelo con el cliente correcto.
 */
@Injectable()
export class BatchCategorizer {
  private readonly logger = new Logger(BatchCategorizer.name);

  constructor(@Inject(LLM_PROVIDER) private readonly llm: LlmProvider) {}

  get model(): string {
    return this.llm.model;
  }

  async categorize(clients: RawClient[]): Promise<BatchResult> {
    const prompt = buildCategorizationPrompt(
      clients.map((client, index) => ({
        ref: index + 1,
        transcript: client.transcript,
      })),
    );

    let text: string;
    let model: string;
    try {
      ({ text, model } = await this.llm.generate(prompt));
    } catch (error) {
      this.logger.warn(`Error del LLM: ${(error as Error).message}`);
      return { records: {}, missing: clients };
    }

    return this.matchResponse(clients, this.safeParse(text), model);
  }

  private safeParse(text: string): ParsedItem[] {
    try {
      return parseBatchResponse(text);
    } catch (error) {
      this.logger.warn(`Respuesta no parseable: ${(error as Error).message}`);
      return [];
    }
  }

  private matchResponse(
    clients: RawClient[],
    items: ParsedItem[],
    model: string,
  ): BatchResult {
    const pendingByRef = new Map(
      clients.map((client, index) => [index + 1, client]),
    );
    const records: Record<string, CategorizationRecord> = {};
    const categorizedAt = new Date().toISOString();

    for (const item of items) {
      const client = pendingByRef.get(item.ref);
      if (!client) continue;
      records[client.id] = {
        categories: item.categories,
        model,
        categorizedAt,
      };
      pendingByRef.delete(item.ref);
    }

    return { records, missing: [...pendingByRef.values()] };
  }
}
