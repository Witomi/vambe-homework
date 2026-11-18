import { DIMENSIONS, DimensionKey } from '../categorization/taxonomy';
import { BreakdownRow } from './aggregations';

export type InsightTone = 'positive' | 'negative' | 'neutral';

export interface Insight {
  id: string;
  tone: InsightTone;
  title: string;
  detail: string;
  /** Filtro sugerido para explorar el insight en el panel. */
  filter?: { key: string; value: string };
}

interface Candidate {
  dimension: DimensionKey;
  row: BreakdownRow;
  lift: number;
}

export interface InsightInput {
  baseRate: number | null;
  categorizedCount: number;
  dimensions: Record<DimensionKey, BreakdownRow[]>;
  matrix: {
    industries: { value: string; label: string }[];
    cells: {
      seller: string;
      industry: string;
      count: number;
      closeRate: number | null;
    }[];
  };
}

/** Valores comodín: un hallazgo sobre "Otro" no es accionable. */
const NON_ACTIONABLE = new Set(['otro', 'no_especificado']);

const pct = (v: number) => `${Math.round(v * 100)}%`;
const pp = (v: number) => `${v > 0 ? '+' : ''}${Math.round(v * 100)} pp`;

/** Dimensiones donde un lift es accionable para el equipo comercial. */
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
 * Genera hallazgos en lenguaje natural comparando la tasa de cierre de cada
 * segmento contra la base. Solo considera segmentos con muestra suficiente
 * para evitar conclusiones sobre 3 casos.
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

  const pickTop = (sorted: Candidate[], n: number) => {
    const seen = new Set<DimensionKey>();
    return sorted
      .filter((c) => !seen.has(c.dimension) && seen.add(c.dimension))
      .slice(0, n);
  };

  const describe = (c: Candidate, tone: InsightTone): Insight => ({
    id: `${tone}-${c.dimension}-${c.row.value}`,
    tone,
    title: `${DIMENSIONS[c.dimension].label}: ${c.row.label}`,
    detail:
      `Cierra ${pct(c.row.closeRate!)} (${pp(c.lift)} vs. ${pct(baseRate)} promedio) ` +
      `en ${c.row.count} reuniones.`,
    filter: { key: c.dimension, value: c.row.value },
  });

  const positives = pickTop(
    candidates.filter((c) => c.lift > 0.02).sort((a, b) => b.lift - a.lift),
    3,
  ).map((c) => describe(c, 'positive'));

  const negatives = pickTop(
    candidates.filter((c) => c.lift < -0.02).sort((a, b) => a.lift - b.lift),
    3,
  ).map((c) => describe(c, 'negative'));

  return [...positives, ...negatives, ...sellerSpecialists(input, minSample)];
}

/** Para los rubros más frecuentes, el vendedor que mejor convierte. */
function sellerSpecialists(input: InsightInput, minSample: number): Insight[] {
  const topIndustries = input.dimensions.industry.slice(0, 3);
  return topIndustries.flatMap((industry) => {
    const cells = input.matrix.cells.filter(
      (c) =>
        c.industry === industry.value && c.count >= Math.ceil(minSample / 2),
    );
    if (cells.length < 2 || industry.closeRate === null) return [];
    const best = cells.reduce((a, b) =>
      (b.closeRate ?? 0) > (a.closeRate ?? 0) ? b : a,
    );
    const lift = best.closeRate! - industry.closeRate;
    if (lift < 0.03) return [];
    return [
      {
        id: `specialist-${industry.value}`,
        tone: 'neutral' as const,
        title: `${best.seller} es especialista en ${industry.label}`,
        detail:
          `Cierra ${pct(best.closeRate!)} en este rubro vs. ${pct(industry.closeRate)} del equipo ` +
          `(${best.count} reuniones). Priorizar su asignación a estos leads.`,
        filter: { key: 'industry', value: industry.value },
      },
    ];
  });
}
