import { DIMENSIONS, DimensionKey, NOT_MENTIONED } from '../domain/taxonomy';
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

/** Valores comodín: un hallazgo sobre "Otro" o "No lo menciona" no es accionable. */
const NON_ACTIONABLE = new Set([
  'otro',
  'no_especificado',
  NOT_MENTIONED.value,
]);

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

/** Porcentaje entero tal como se muestra: 0.676 → 68. */
const displayedPct = (v: number) => Math.round(v * 100);
const pct = (v: number) => `${displayedPct(v)}%`;
/** Diferencia sobre los porcentajes redondeados, para que cuadre con el texto. */
const pointsDiff = (rate: number, base: number) =>
  displayedPct(rate) - displayedPct(base);

/**
 * Genera los hallazgos más relevantes en lenguaje simple: los segmentos que
 * más se alejan de la tasa de cierre promedio, hacia arriba y hacia abajo.
 * Solo considera segmentos con muestra suficiente (≥ 3% del total), para
 * no sacar conclusiones sobre 3 casos.
 */
export function generateInsights(input: InsightInput): Insight[] {
  const { baseRate, categorizedCount } = input;
  if (baseRate === null || categorizedCount < 20) return [];
  const minSample = Math.max(10, Math.round(categorizedCount * 0.03));

  const candidates: Candidate[] = INSIGHT_DIMENSIONS.flatMap((dimension) =>
    input.dimensions[dimension]
      .filter(
        (row) =>
          row.count >= minSample &&
          row.closeRate !== null &&
          !NON_ACTIONABLE.has(row.value),
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
      `Cierran ${pct(c.row.closeRate!)}, ` +
      `${Math.abs(pointsDiff(c.row.closeRate!, baseRate))} puntos ` +
      `${c.lift > 0 ? 'más' : 'menos'} que el promedio (${pct(baseRate)}). ` +
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
