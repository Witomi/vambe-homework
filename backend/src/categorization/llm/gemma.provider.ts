import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { Logger } from '@nestjs/common';
import { sleep } from '../../utils/async';
import { LlmProvider, LlmRateLimitError, LlmResult } from './llm-provider';

export interface GemmaProviderOptions {
  apiKey: string;
  model: string;
  /** Modelo alternativo si el principal está saturado (503). */
  fallbackModel?: string;
  temperature: number;
  /** `minimal` reduce la latencia ~10x: la extracción no requiere razonar. */
  thinkingLevel?: 'minimal' | 'default';
  timeoutMs: number;
}

const DEFAULT_RETRY_MS = 30_000;
const MAX_TRANSIENT_RETRIES = 5;

/** Errores del servidor que suelen resolverse reintentando. */
const TRANSIENT =
  /\b(500|502|503|504)\b|UNAVAILABLE|DEADLINE_EXCEEDED|INTERNAL|aborted|fetch failed|ECONNRESET|ETIMEDOUT/i;

/**
 * Gemma (modelo abierto de Google) servido por la API de Google AI Studio.
 *
 * - Gemma no soporta "JSON mode" en esta API: el formato se pide en el prompt
 *   y se valida en `response-parser`.
 * - El free tier responde 503 con frecuencia en horas peak: se reintenta con
 *   backoff exponencial alternando entre el modelo principal y el de respaldo.
 */
export class GemmaProvider implements LlmProvider {
  private readonly logger = new Logger(GemmaProvider.name);
  private readonly client: GoogleGenAI;
  private readonly models: string[];
  readonly model: string;

  constructor(private readonly options: GemmaProviderOptions) {
    this.client = new GoogleGenAI({
      apiKey: options.apiKey,
      httpOptions: { timeout: options.timeoutMs },
    });
    this.model = options.model;
    this.models = [options.model, options.fallbackModel].filter(
      (model): model is string => !!model,
    );
  }

  async generate(prompt: string): Promise<LlmResult> {
    for (let attempt = 0; ; attempt++) {
      const model = this.models[attempt % this.models.length];
      try {
        return { text: await this.call(model, prompt), model };
      } catch (error) {
        const mapped = this.mapError(error);
        const transient = TRANSIENT.test(mapped.message);
        if (!transient || attempt >= MAX_TRANSIENT_RETRIES) throw mapped;

        const delay = Math.min(2_000 * 2 ** attempt, 30_000);
        this.logger.warn(
          `${model} no disponible (${mapped.message.slice(0, 60)}…), reintento en ${delay / 1000}s`,
        );
        await sleep(delay);
      }
    }
  }

  private async call(model: string, prompt: string): Promise<string> {
    const response = await this.client.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: this.options.temperature,
        ...(this.options.thinkingLevel === 'minimal' && {
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        }),
      },
    });
    const text = response.text;
    if (!text) throw new Error('Respuesta vacía del modelo');
    return text;
  }

  private mapError(error: unknown): Error {
    const message = error instanceof Error ? error.message : String(error);
    if (/RESOURCE_EXHAUSTED|\b429\b/.test(message)) {
      // La API indica el tiempo de espera como "retryDelay":"37s".
      const match = /retryDelay"?\s*:\s*"?(\d+(?:\.\d+)?)s/.exec(message);
      const retryMs = match ? Math.ceil(Number(match[1]) * 1000) : undefined;
      return new LlmRateLimitError(message, retryMs ?? DEFAULT_RETRY_MS);
    }
    return error instanceof Error ? error : new Error(message);
  }
}
