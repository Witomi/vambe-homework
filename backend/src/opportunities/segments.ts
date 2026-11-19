import { Client } from '../domain/client';
import { DIMENSIONS, DimensionKey, NOT_MENTIONED } from '../domain/taxonomy';
import { breakdownByDimension } from '../metrics/aggregations';
import { Segment } from './opportunities.types';

/** Valores comodín que no sirven para decidir nada. */
const NON_ACTIONABLE = new Set([
  'otro',
  'no_especificado',
  NOT_MENTIONED.value,
]);

/** Mínimo de reuniones para confiar en la tasa de un grupo. */
export function minSample(categorized: number): number {
  return Math.max(10, Math.round(categorized * 0.02));
}

/** Grupos accionables de una dimensión, con muestra suficiente. */
export function segmentsOf(
  clients: readonly Client[],
  dimension: DimensionKey,
): Segment[] {
  const min = minSample(clients.length);
  return breakdownByDimension(clients, dimension)
    .filter(
      (row) =>
        row.count >= min &&
        row.closeRate !== null &&
        !NON_ACTIONABLE.has(row.value),
    )
    .map((row) => ({
      dimension,
      dimensionLabel: DIMENSIONS[dimension].label,
      value: row.value,
      label: row.label,
      count: row.count,
      closeRate: row.closeRate!,
    }));
}

/** Diferencia en puntos sobre porcentajes redondeados (cuadra con la UI). */
export function pointsDiff(rate: number, base: number): number {
  return Math.round(rate * 100) - Math.round(base * 100);
}
