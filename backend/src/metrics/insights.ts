import { formatPct, minReliableSample, pointsDiff } from '../analytics/rates';
import { DIMENSIONS, DimensionKey, isActionable } from '../domain/taxonomy';
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
      .filter((c) => !seen.has(c.dimension) && seen.add(c.dimension))
      .slice(0, PER_TONE);
  };

  const describe = (c: Candidate, tone: InsightTone): Insight => ({
    id: `${tone}-${c.dimension}-${c.row.value}`,
    tone,
    title: `${DIMENSIONS[c.dimension].label}: ${c.row.label}`,
    detail:
      `Cierran ${formatPct(c.row.closeRate!)}, ` +
      `${Math.abs(pointsDiff(c.row.closeRate!, baseRate))} puntos ` +
      `${c.lift > 0 ? 'más' : 'menos'} que el promedio (${formatPct(baseRate)}). ` +
      `${c.row.count} reuniones.`,
    filter: { key: c.dimension, value: c.row.value },
  });

  const positives = pickTop(
    candidates.filter((c) => c.lift > 0.02).sort((a, b) => b.lift - a.lift),
  ).map((c) => describe(c, 'positive'));

  const negatives = pickTop(
    candidates.filter((c) => c.lift < -0.02).sort((a, b) => a.lift - b.lift),
  ).map((c) => describe(c, 'negative'));

  return [...positives, ...negatives];
}
