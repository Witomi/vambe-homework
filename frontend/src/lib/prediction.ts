import type { Prediction } from './api/types';

/**
 * Filas del gráfico de distribución de la vista Predicción: cuántos clientes
 * cerraron y cuántos no, agrupados por probabilidad estimada o por nota.
 */

/** Una barra: un grupo de clientes y cuántos cerraron. */
export interface DistributionRow {
  label: string;
  /** Título del tooltip. */
  title: string;
  closed: number;
  open: number;
  closeRate: number;
}

/** Etiqueta de un tramo por su inicio: 0.35 → "35%". */
export const bucketLabel = (from: number) => `${Math.round(from * 100)}%`;
const rateOf = (closed: number, open: number) =>
  closed + open ? closed / (closed + open) : 0;

/** Una barra por tramo de probabilidad, solo entre el primero y el último con datos. */
export function probabilityRows(
  buckets: Prediction['buckets'],
): DistributionRow[] {
  // Solo el tramo con datos, para no mostrar barras vacías en los extremos.
  const first = buckets.findIndex((bucket) => bucket.closed + bucket.open > 0);
  const last = buckets.findLastIndex(
    (bucket) => bucket.closed + bucket.open > 0,
  );
  return buckets.slice(first, last + 1).map((bucket) => ({
    label: bucketLabel(bucket.from),
    title: `Probabilidad ${bucketLabel(bucket.from)}–${bucketLabel(bucket.to)}`,
    closed: bucket.closed,
    open: bucket.open,
    closeRate: rateOf(bucket.closed, bucket.open),
  }));
}

/** Una barra por nota, de F a A. */
export function gradeRows(grades: Prediction['grades']): DistributionRow[] {
  // De menor a mayor probabilidad, igual que la vista por probabilidad.
  return [...grades].reverse().map((grade) => ({
    label: grade.grade,
    title: `Nota ${grade.grade} · ${grade.title} (${grade.range})`,
    closed: grade.closed,
    open: grade.count - grade.closed,
    closeRate: rateOf(grade.closed, grade.count - grade.closed),
  }));
}
