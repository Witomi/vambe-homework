import { minReliableSample, pointsDiff } from '../analytics/rates';
import { formatPct } from '../utils/format';
import { DIMENSIONS, DimensionKey, isActionable } from '../domain/categories';
import { BreakdownRow, Insight, InsightTone } from './metrics.types';

interface Candidate {
  dimension: DimensionKey;
  row: BreakdownRow;
  /** Diferencia con la tasa promedio (0.11 = 11 puntos sobre el promedio). */
  lift: number;
}

export interface InsightInput {
  baseRate: number | null;
  categorizedCount: number;
  dimensions: Record<DimensionKey, BreakdownRow[]>;
}

/** Cuántos hallazgos mostrar de cada lado: los que más suben y los que más bajan. */
const PER_TONE = 2;

/** Dimensiones donde una diferencia es accionable para el equipo comercial. */
const INSIGHT_DIMENSIONS: DimensionKey[] = [
  'industry',
  'leadSource',
  'painPoint',
  'objections',
  'integrations',
  'requirements',
  'urgency',
  'complexity',
  'businessSize',
  'inquiryChannel',
];

/**
 * Genera los hallazgos más relevantes en lenguaje simple: los segmentos que
 * más se alejan de la tasa de cierre promedio, hacia arriba y hacia abajo.
 * Solo considera segmentos con muestra suficiente (≥ 3% del total), para
 * no sacar conclusiones sobre 3 casos.
 */
export function generateInsights(input: InsightInput): Insight[] {
  const { baseRate, categorizedCount } = input;
  if (baseRate === null || categorizedCount < 20) return [];
  const minSample = minReliableSample(categorizedCount, 0.03);

  const candidates: Candidate[] = INSIGHT_DIMENSIONS.flatMap((dimension) =>
    input.dimensions[dimension]
      .filter(
        (row) =>
          row.count >= minSample &&
          row.closeRate !== null &&
          isActionable(row.value),
      )
      .map((row) => ({ dimension, row, lift: row.closeRate! - baseRate })),
  );

  /** Los mejores N, sin repetir dimensión (más variedad de hallazgos). */
  const pickTop = (sorted: Candidate[]) => {
    const seen = new Set<DimensionKey>();
    return sorted
      .filter(
        (candidate) =>
          !seen.has(candidate.dimension) && seen.add(candidate.dimension),
      )
      .slice(0, PER_TONE);
  };

  const describe = (candidate: Candidate, tone: InsightTone): Insight => ({
    id: `${tone}-${candidate.dimension}-${candidate.row.value}`,
    tone,
    title: `${DIMENSIONS[candidate.dimension].label}: ${candidate.row.label}`,
    detail:
      `Cierran ${formatPct(candidate.row.closeRate!)}, ` +
      `${Math.abs(pointsDiff(candidate.row.closeRate!, baseRate))} puntos ` +
      `${candidate.lift > 0 ? 'más' : 'menos'} que el promedio (${formatPct(baseRate)}). ` +
      `${candidate.row.count} reuniones.`,
    filter: { key: candidate.dimension, value: candidate.row.value },
  });

  const positives = pickTop(
    candidates
      .filter((candidate) => candidate.lift > 0.02)
      .sort((candidateA, candidateB) => candidateB.lift - candidateA.lift),
  ).map((candidate) => describe(candidate, 'positive'));

  const negatives = pickTop(
    candidates
      .filter((candidate) => candidate.lift < -0.02)
      .sort((candidateA, candidateB) => candidateA.lift - candidateB.lift),
  ).map((candidate) => describe(candidate, 'negative'));

  return [...positives, ...negatives];
}
