import { CategorizedClient } from '../domain/client';
import { DIMENSIONS, DimensionKey, isActionable } from '../domain/categories';
import { breakdownByDimension } from './breakdown';
import { minReliableSample, pointsDiff, rateStat } from './rates';

/**
 * Dimensiones donde buscar palancas: lo que distingue a los clientes de un
 * grupo que sí compraron. Todas salen de lo que el cliente contó.
 */
const LEVER_DIMENSIONS: DimensionKey[] = [
  'leadSource',
  'industry',
  'businessSize',
  'painPoint',
  'urgency',
  'inquiryChannel',
  'useCases',
  'integrations',
  'requirements',
  'objections',
  'seasonality',
];

/** Una diferencia menor que esto, dentro de un grupo, es ruido. */
const MIN_LIFT_PTS = 5;
const MAX_LEVERS = 3;

/** Un rasgo con el que los clientes de un grupo cierran más que el grupo. */
export interface Lever {
  dimension: DimensionKey;
  dimensionLabel: string;
  value: string;
  label: string;
  /** Clientes del grupo que tienen el rasgo. */
  count: number;
  closeRate: number;
  /** Tasa de cierre de todo el grupo, para comparar. */
  groupRate: number;
}

/**
 * Qué tenían los clientes de un grupo que sí cerraron: los rasgos con los
 * que el grupo cierra al menos 5 puntos más que su propio promedio, con
 * muestra suficiente (al menos el 10% del grupo y 10 reuniones). Se toma el
 * mejor rasgo de cada dimensión y luego los de mayor diferencia.
 *
 * Son asociaciones, no causas: muestran dónde mirar, no qué garantiza la venta.
 */
export function findLevers(
  group: readonly CategorizedClient[],
  exclude?: DimensionKey,
): Lever[] {
  const groupRate = rateStat(group).closeRate;
  if (groupRate === null) return [];
  const min = minReliableSample(group.length, 0.1);

  return LEVER_DIMENSIONS.filter((d) => d !== exclude)
    .flatMap((dimension) => {
      const best = breakdownByDimension(group, dimension)
        .filter(
          (row) =>
            isActionable(row.value) &&
            row.count >= min &&
            // Un rasgo que tienen todos no distingue a nadie.
            row.count < group.length &&
            row.closeRate !== null &&
            pointsDiff(row.closeRate, groupRate) >= MIN_LIFT_PTS,
        )
        .sort((a, b) => (b.closeRate ?? 0) - (a.closeRate ?? 0))[0];
      return best
        ? [
            {
              dimension,
              dimensionLabel: DIMENSIONS[dimension].label,
              value: best.value,
              label: best.label,
              count: best.count,
              closeRate: best.closeRate ?? 0,
              groupRate,
            },
          ]
        : [];
    })
    .sort((a, b) => b.closeRate - a.closeRate)
    .slice(0, MAX_LEVERS);
}
