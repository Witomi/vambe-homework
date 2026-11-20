import { rateStat } from '../analytics/rates';
import { CategorizedClient } from '../domain/client';
import { GRADES, gradeOf, gradeRange } from './grades';
import { ClosingModel } from './closing-model';
import { auc, binByProbability, logLoss } from './evaluation';
import { Factor, GradeSummary, PredictionResponse } from './prediction.types';

const BUCKET_WIDTH = 0.05;
const TOP_FACTORS = 6;

/**
 * Informe del modelo para la vista Predicción: calidad, notas A–F con su
 * tasa de cierre real, distribución por probabilidad y factores principales.
 */
export function buildModelReport(
  categorized: readonly CategorizedClient[],
  model: ClosingModel,
): PredictionResponse {
  const probs = categorized.map(
    (client) => model.probabilities.get(client.id) ?? 0,
  );
  const outcomes = categorized.map((client) => (client.closed ? 1 : 0));
  const baseRate =
    outcomes.reduce((total, outcome) => total + outcome, 0) / outcomes.length;

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
      l2: model.l2,
    },
    grades: summarizeGrades(categorized, probs),
    buckets: binByProbability(probs, outcomes, BUCKET_WIDTH),
    factors: topFactors(model.factors),
  };
}

/**
 * Cuántos clientes hay en cada nota, cuánto cerraron realmente y cuánto
 * queda por recuperar (los que no cerraron y sus consultas al mes).
 */
function summarizeGrades(
  categorized: readonly CategorizedClient[],
  probs: readonly number[],
): GradeSummary[] {
  return GRADES.map(({ grade, title }) => {
    const members = categorized.filter(
      (_, index) => gradeOf(probs[index]) === grade,
    );
    const open = members.filter((client) => !client.closed);
    return {
      grade,
      title,
      range: gradeRange(grade),
      ...rateStat(members),
      share: categorized.length ? members.length / categorized.length : 0,
      openLeads: open.length,
      openInquiries: open.reduce(
        (sum, client) => sum + (client.categories.monthlyInquiries ?? 0),
        0,
      ),
    };
  });
}

/** Las variables que más suben y más bajan la probabilidad. */
function topFactors(factors: readonly Factor[]) {
  return {
    positive: factors
      .filter((factor) => factor.weight > 0)
      .sort((factorA, factorB) => factorB.weight - factorA.weight)
      .slice(0, TOP_FACTORS),
    negative: factors
      .filter((factor) => factor.weight < 0)
      .sort((factorA, factorB) => factorA.weight - factorB.weight)
      .slice(0, TOP_FACTORS),
  };
}
