import { Grade } from './grades';

/** Contrato de respuesta de `GET /api/prediction`. */

export interface PredictionQuality {
  /** Reuniones usadas (las analizadas con IA). */
  sampleSize: number;
  /** Tasa de cierre real de la muestra. */
  baseRate: number;
  /** Qué tan bien ordena: 0,5 = azar, 1 = perfecto. */
  auc: number;
  /** Error del modelo vs. predecir siempre la tasa base (menor es mejor). */
  logLoss: number;
  baselineLogLoss: number;
  folds: number;
}

/** Rango de probabilidad con cuántos clientes cerraron y cuántos no. */
export interface ProbabilityBucket {
  from: number;
  to: number;
  closed: number;
  open: number;
  /** Probabilidad promedio que predijo el modelo en este rango. */
  meanPredicted: number;
}

/** Variable del modelo y su efecto sobre la probabilidad de cierre. */
export interface Factor {
  label: string;
  /** Peso en log-odds: positivo sube la probabilidad, negativo la baja. */
  weight: number;
  /** Cuántas veces multiplica las chances de cierre (e^peso). */
  oddsRatio: number;
}

/** Una nota (A–D) y cómo cerraron realmente los clientes que la tienen. */
export interface GradeSummary {
  grade: Grade;
  title: string;
  /** "≥ 75%", "70%–75%"… */
  range: string;
  action: string;
  count: number;
  closed: number;
  /** Tasa de cierre real de esta nota: valida que las notas significan algo. */
  closeRate: number | null;
}

/** Predicción de un cliente, para mostrar junto a sus datos. */
export interface ClientPrediction {
  probability: number;
  grade: Grade;
}

export interface PredictionResponse {
  quality: PredictionQuality;
  grades: GradeSummary[];
  buckets: ProbabilityBucket[];
  factors: { positive: Factor[]; negative: Factor[] };
}
