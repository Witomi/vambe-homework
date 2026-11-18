export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

export interface LlmResult {
  text: string;
  /** Modelo que efectivamente respondió (puede ser el de respaldo). */
  model: string;
}

/** Abstracción mínima sobre un modelo de lenguaje: texto entra, texto sale. */
export interface LlmProvider {
  /** Modelo principal configurado. */
  readonly model: string;
  generate(prompt: string): Promise<LlmResult>;
}

/** El proveedor rechazó la request por cuota; reintentar tras `retryAfterMs`. */
export class LlmRateLimitError extends Error {
  constructor(
    message: string,
    readonly retryAfterMs: number,
  ) {
    super(message);
  }
}
