import { breakdownByDimension } from '../analytics/breakdown';
import { minReliableSample } from '../analytics/rates';
import { CategorizedClient } from '../domain/client';
import { DIMENSIONS, DimensionKey, isActionable } from '../domain/categories';
import { Segment } from './opportunities.types';

/**
 * Grupos accionables de una dimensión (sin comodines como "Otro") y con
 * muestra suficiente para confiar en su tasa de cierre.
 */
export function segmentsOf(
  clients: readonly CategorizedClient[],
  dimension: DimensionKey,
): Segment[] {
  const min = minReliableSample(clients.length);
  return breakdownByDimension(clients, dimension).flatMap((row) =>
    row.count >= min && row.closeRate !== null && isActionable(row.value)
      ? [
          {
            dimension,
            dimensionLabel: DIMENSIONS[dimension].label,
            value: row.value,
            label: row.label,
            count: row.count,
            closeRate: row.closeRate,
          },
        ]
      : [],
  );
}
