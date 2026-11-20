export interface CategorizationRunOptions {
  /** Máximo de clientes pendientes en esta corrida; sin valor, todos. */
  limit?: number;
  /** Transcripciones por request al LLM. */
  batchSize: number;
  /** Requests en vuelo simultáneamente. */
  concurrency: number;
}

/** Opciones para volver a categorizar clientes específicos. */
export type RecategorizeOptions = Pick<
  CategorizationRunOptions,
  'batchSize' | 'concurrency'
>;

export interface CategorizationRunSummary {
  requested: number;
  categorized: number;
  failed: number;
  /** Total acumulado en el store después de la corrida. */
  totalCategorized: number;
  durationMs: number;
}
