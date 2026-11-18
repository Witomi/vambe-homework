export interface CategorizationRunOptions {
  /** Cuántos clientes pendientes categorizar en esta corrida. */
  limit: number;
  /** Transcripciones por request al LLM. */
  batchSize: number;
  /** Requests en vuelo simultáneamente. */
  concurrency: number;
  /** Semilla de la muestra aleatoria (misma semilla = misma muestra). */
  seed: number;
}

export interface CategorizationRunSummary {
  requested: number;
  categorized: number;
  failed: number;
  /** Total acumulado en el store después de la corrida. */
  totalCategorized: number;
  durationMs: number;
}
