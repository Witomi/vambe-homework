import { formatPct } from '../common/format';

/**
 * Notas de cliente (A–F) según su probabilidad de cierre estimada.
 *
 * Los cortes van de 5 en 5 puntos desde 65% hacia arriba; la nota más baja
 * (F) agrupa todo lo que queda bajo 65%.
 * No son cuantiles a propósito: así la proporción de clientes en cada nota
 * cambia con los datos y dice algo. La tabla de notas en /api/prediction
 * muestra cuánto cierra realmente cada una.
 * Es un concepto de dominio: lo usan clientes, filtros, oportunidades y meta.
 */

export const GRADES = [
  { grade: 'A', min: 0.85, title: 'Muy alta' },
  { grade: 'B', min: 0.8, title: 'Alta' },
  { grade: 'C', min: 0.75, title: 'Media alta' },
  { grade: 'D', min: 0.7, title: 'Media' },
  { grade: 'E', min: 0.65, title: 'Baja' },
  { grade: 'F', min: 0, title: 'Muy baja' },
] as const;

export type Grade = (typeof GRADES)[number]['grade'];

/** Probabilidad de cierre estimada de un cliente y su nota. */
export interface ClientPrediction {
  probability: number;
  grade: Grade;
}

export const GRADE_VALUES = GRADES.map((definition) => definition.grade);

/** Nota correspondiente a una probabilidad (0..1). */
export function gradeOf(probability: number): Grade {
  return GRADES.find((definition) => probability >= definition.min)!.grade;
}

/** Rango legible de cada nota: "≥ 75%", "70%–75%", "< 62%". */
export function gradeRange(grade: Grade): string {
  const index = GRADES.findIndex((definition) => definition.grade === grade);
  const min = GRADES[index].min;
  if (index === 0) return `≥ ${formatPct(min)}`;
  const max = GRADES[index - 1].min;
  return min === 0
    ? `< ${formatPct(max)}`
    : `${formatPct(min)}–${formatPct(max)}`;
}
