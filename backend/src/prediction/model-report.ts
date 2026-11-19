import { CategorizedClient } from '../domain/client';
import { GRADES, gradeOf, gradeRange } from '../domain/grades';
import { ClosingModel } from './closing-model';
import { auc, binByProbability, logLoss } from './evaluation';
import { Factor, GradeSummary, PredictionResponse } from './prediction.types';

const BUCKET_WIDTH = 0.05;
const TOP_FACTORS = 6;

/**
 * Informe del modelo para la vista Predicción: calidad, notas A–D con su
 * tasa de cierre real, distribución por probabilidad y factores principales.
 */
export function buildModelReport(
  categorized: readonly CategorizedClient[],
  model: ClosingModel,
): PredictionResponse {
  const probs = categorized.map((c) => model.probabilities.get(c.id) ?? 0);
  const outcomes = categorized.map((c) => (c.closed ? 1 : 0));
  const baseRate = outcomes.reduce((a, b) => a + b, 0) / outcomes.length;

  return {
    quality: {
      sampleSize: categorized.length,
      baseRate,
      auc: auc(probs, outcomes),
      logLoss: logLoss(probs, outcomes),
      baselineLogLoss: logLoss(
        probs.map(() => baseRate),
        outcomes,
      ),
      folds: model.folds,
    },
    grades: summarizeGrades(probs, outcomes),
    buckets: binByProbability(probs, outcomes, BUCKET_WIDTH),
    factors: topFactors(model.factors),
  };
}

/** Cuántos clientes hay en cada nota y cuánto cerraron realmente. */
function summarizeGrades(
  probs: readonly number[],
  outcomes: readonly number[],
): GradeSummary[] {
  return GRADES.map(({ grade, title, action }) => {
    const members = probs
      .map((p, i) => ({ p, y: outcomes[i] }))
      .filter(({ p }) => gradeOf(p) === grade);
    const closed = members.filter((m) => m.y === 1).length;
    return {
      grade,
      title,
      action,
      range: gradeRange(grade),
      count: members.length,
      closed,
      closeRate: members.length ? closed / members.length : null,
    };
  });
}

/** Las variables que más suben y más bajan la probabilidad. */
function topFactors(factors: readonly Factor[]) {
  return {
    positive: factors
      .filter((f) => f.weight > 0)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, TOP_FACTORS),
    negative: factors
      .filter((f) => f.weight < 0)
      .sort((a, b) => a.weight - b.weight)
      .slice(0, TOP_FACTORS),
  };
}
