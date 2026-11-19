import {
  Categories,
  DIMENSIONS,
  MULTI_DIMENSION_KEYS,
  SINGLE_DIMENSION_KEYS,
} from '../../domain/categories';

/** Una transcripción etiquetada a mano (el "gold standard"). */
export interface GoldItem {
  id: string;
  transcript: string;
  /** Solo los casos revisados por una persona cuentan para la evaluación. */
  reviewed: boolean;
  expected: Categories;
}

export interface DimensionScore {
  dimension: string;
  label: string;
  /** Simple: aciertos exactos. Lista: coincidencia exacta del conjunto. */
  exactMatch: number;
  /** Solo listas: solapamiento promedio entre conjuntos (Jaccard). */
  overlap: number | null;
}

export interface EvaluationReport {
  evaluated: number;
  dimensions: DimensionScore[];
  /** Consultas/mes dentro de ±20% del valor esperado (o ambos vacíos). */
  inquiriesWithin20Pct: number;
}

/** Tolerancia para considerar correcto el volumen de consultas. */
const INQUIRIES_TOLERANCE = 0.2;

function jaccard(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  const intersection = [...setA].filter((v) => setB.has(v)).length;
  return intersection / new Set([...setA, ...setB]).size;
}

function inquiriesMatch(expected: number | null, actual: number | null) {
  if (expected === null || actual === null) return expected === actual;
  return Math.abs(actual - expected) <= expected * INQUIRIES_TOLERANCE;
}

const ratio = (hits: number, total: number) => (total ? hits / total : 0);

/**
 * Compara las categorías del LLM con las etiquetas humanas.
 * Solo considera ítems revisados y con predicción disponible.
 */
export function evaluate(
  gold: readonly GoldItem[],
  predicted: ReadonlyMap<string, Categories>,
): EvaluationReport {
  const pairs = gold
    .filter((g) => g.reviewed && predicted.has(g.id))
    .map((g) => ({ expected: g.expected, actual: predicted.get(g.id)! }));
  const n = pairs.length;

  const single = SINGLE_DIMENSION_KEYS.map((key) => ({
    dimension: key,
    label: DIMENSIONS[key].label,
    exactMatch: ratio(
      pairs.filter((p) => p.expected[key] === p.actual[key]).length,
      n,
    ),
    overlap: null,
  }));

  const multi = MULTI_DIMENSION_KEYS.map((key) => {
    const scores = pairs.map((p) => jaccard(p.expected[key], p.actual[key]));
    return {
      dimension: key,
      label: DIMENSIONS[key].label,
      exactMatch: ratio(scores.filter((s) => s === 1).length, n),
      overlap: ratio(
        scores.reduce((sum, s) => sum + s, 0),
        n,
      ),
    };
  });

  return {
    evaluated: n,
    dimensions: [...single, ...multi],
    inquiriesWithin20Pct: ratio(
      pairs.filter((p) =>
        inquiriesMatch(p.expected.monthlyInquiries, p.actual.monthlyInquiries),
      ).length,
      n,
    ),
  };
}
