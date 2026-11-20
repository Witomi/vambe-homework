import {
  Categories,
  DIMENSIONS,
  DIMENSION_KEYS,
  DimensionKey,
} from '../../domain/categories';

/** Un caso de referencia ("gold standard"): una transcripción con su categorización correcta. */
export interface GoldItem {
  id: string;
  transcript: string;
  /** Solo los casos revisados cuentan para la evaluación. */
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

/** Resultado de un caso: qué parte de sus campos acertó el LLM. */
export interface CaseScore {
  /** Posición en gold.json (1 = primer caso). */
  position: number;
  id: string;
  /** Fracción de campos correctos (dimensiones + volúmenes). */
  accuracy: number;
  /** Etiquetas de los campos con error. */
  errors: string[];
}

export interface EvaluationReport {
  evaluated: number;
  dimensions: DimensionScore[];
  /** Consultas/mes dentro de ±20% del valor esperado (o ambos vacíos). */
  inquiriesWithin20Pct: number;
  /** Lo mismo para las consultas/mes en peak. */
  peakInquiriesWithin20Pct: number;
  cases: CaseScore[];
}

/** Tolerancia para considerar correcto el volumen de consultas. */
const INQUIRIES_TOLERANCE = 0.2;

const INQUIRY_FIELDS = [
  { key: 'monthlyInquiries', label: 'Consultas/mes' },
  { key: 'peakMonthlyInquiries', label: 'Consultas/mes en peak' },
] as const;

function jaccard(a: readonly string[], b: readonly string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  const intersection = [...setA].filter((v) => setB.has(v)).length;
  return intersection / new Set([...setA, ...setB]).size;
}

/** Similitud de una dimensión: 1 o 0 en las simples, Jaccard en las listas. */
function similarity(
  key: DimensionKey,
  expected: Categories,
  actual: Categories,
): number {
  const e = expected[key];
  const a = actual[key];
  if (Array.isArray(e) && Array.isArray(a)) return jaccard(e, a);
  return e === a ? 1 : 0;
}

function inquiriesMatch(expected: number | null, actual: number | null) {
  if (expected === null || actual === null) return expected === actual;
  return Math.abs(actual - expected) <= expected * INQUIRIES_TOLERANCE;
}

const mean = (values: readonly number[]) =>
  values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;

const share = (hits: readonly boolean[]) => mean(hits.map(Number));

interface Pair {
  position: number;
  id: string;
  expected: Categories;
  actual: Categories;
}

function scoreCase(pair: Pair): CaseScore {
  const checks = [
    ...DIMENSION_KEYS.map((key) => ({
      label: DIMENSIONS[key].label,
      correct: similarity(key, pair.expected, pair.actual) === 1,
    })),
    ...INQUIRY_FIELDS.map(({ key, label }) => ({
      label,
      correct: inquiriesMatch(pair.expected[key] ?? null, pair.actual[key]),
    })),
  ];
  return {
    position: pair.position,
    id: pair.id,
    accuracy: share(checks.map((c) => c.correct)),
    errors: checks.filter((c) => !c.correct).map((c) => c.label),
  };
}

/**
 * Compara las categorías del LLM con las etiquetas de referencia del gold.
 * Solo considera casos revisados y con predicción disponible.
 */
export function evaluate(
  gold: readonly GoldItem[],
  predicted: ReadonlyMap<string, Categories>,
): EvaluationReport {
  const pairs: Pair[] = gold.flatMap((g, i) => {
    const actual = predicted.get(g.id);
    return g.reviewed && actual
      ? [{ position: i + 1, id: g.id, expected: g.expected, actual }]
      : [];
  });

  const dimensions = DIMENSION_KEYS.map((key) => {
    const scores = pairs.map((p) => similarity(key, p.expected, p.actual));
    return {
      dimension: key,
      label: DIMENSIONS[key].label,
      exactMatch: share(scores.map((s) => s === 1)),
      overlap: DIMENSIONS[key].multi ? mean(scores) : null,
    };
  });

  const [monthly, peak] = INQUIRY_FIELDS.map(({ key }) =>
    share(
      pairs.map((p) => inquiriesMatch(p.expected[key] ?? null, p.actual[key])),
    ),
  );

  return {
    evaluated: pairs.length,
    dimensions,
    inquiriesWithin20Pct: monthly,
    peakInquiriesWithin20Pct: peak,
    cases: pairs.map(scoreCase),
  };
}
