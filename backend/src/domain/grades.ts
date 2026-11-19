/**
 * Notas de cliente (A–D) según su probabilidad de cierre estimada.
 *
 * Los cortes se eligieron sobre la distribución real de probabilidades
 * (validación cruzada) para que cada nota agrupe una porción útil de
 * clientes y la tasa de cierre real baje de forma consistente de A a D.
 * La tabla de notas en /api/prediction muestra esa verificación.
 * Es un concepto de dominio: lo usan clientes, filtros, oportunidades y meta.
 */

export const GRADES = [
  {
    grade: 'A',
    min: 0.75,
    title: 'Muy probable',
    action:
      'Prioridad máxima: contactar primero y asignar al mejor vendedor del rubro.',
  },
  {
    grade: 'B',
    min: 0.7,
    title: 'Probable',
    action: 'Seguimiento activo: agendar demo y enviar propuesta pronto.',
  },
  {
    grade: 'C',
    min: 0.62,
    title: 'Incierto',
    action:
      'Nutrir: compartir casos de éxito de su rubro y resolver objeciones.',
  },
  {
    grade: 'D',
    min: 0,
    title: 'Poco probable',
    action:
      'Baja prioridad: seguimiento automatizado hasta que muestre interés.',
  },
] as const;

export type Grade = (typeof GRADES)[number]['grade'];

/** Probabilidad de cierre estimada de un cliente y su nota. */
export interface ClientPrediction {
  probability: number;
  grade: Grade;
}

export const GRADE_VALUES = GRADES.map((g) => g.grade);

/** Nota correspondiente a una probabilidad (0..1). */
export function gradeOf(probability: number): Grade {
  return GRADES.find((g) => probability >= g.min)!.grade;
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

/** Rango legible de cada nota: "≥ 75%", "70%–75%", "< 62%". */
export function gradeRange(grade: Grade): string {
  const index = GRADES.findIndex((g) => g.grade === grade);
  const min = GRADES[index].min;
  if (index === 0) return `≥ ${pct(min)}`;
  const max = GRADES[index - 1].min;
  return min === 0 ? `< ${pct(max)}` : `${pct(min)}–${pct(max)}`;
}
