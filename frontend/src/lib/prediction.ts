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
  const first = buckets.findIndex((b) => b.closed + b.open > 0);
  const last = buckets.findLastIndex((b) => b.closed + b.open > 0);
  return buckets.slice(first, last + 1).map((b) => ({
    label: bucketLabel(b.from),
    title: `Probabilidad ${bucketLabel(b.from)}–${bucketLabel(b.to)}`,
    closed: b.closed,
    open: b.open,
    closeRate: rateOf(b.closed, b.open),
  }));
}

/** Una barra por nota, de F a A. */
export function gradeRows(grades: Prediction['grades']): DistributionRow[] {
  // De menor a mayor probabilidad, igual que la vista por probabilidad.
  return [...grades].reverse().map((g) => ({
    label: g.grade,
    title: `Nota ${g.grade} · ${g.title} (${g.range})`,
    closed: g.closed,
    open: g.count - g.closed,
    closeRate: rateOf(g.closed, g.count - g.closed),
  }));
}
