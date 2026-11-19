import { Client } from '../domain/client';
import { DimensionKey } from '../domain/taxonomy';
import { Blocker } from './opportunities.types';
import { suggestedAction } from './playbook';
import { pointsDiff, segmentsOf } from './segments';

/** Rasgos sobre los que Vambe puede hacer algo (producto o preventa). */
const BLOCKER_DIMENSIONS: DimensionKey[] = [
  'requirements',
  'objections',
  'integrations',
  'useCases',
  'painPoint',
];
const MIN_DROP_PTS = 3;
const TOP = 5;

/**
 * Rasgos de la reunión que bajan la tasa de cierre, de mayor a menor
 * impacto (puntos perdidos × reuniones afectadas), con la acción sugerida.
 */
export function findBlockers(
  categorized: readonly Client[],
  baseRate: number,
): Blocker[] {
  return BLOCKER_DIMENSIONS.flatMap((dimension) =>
    segmentsOf(categorized, dimension)
      .filter((s) => pointsDiff(s.closeRate, baseRate) <= -MIN_DROP_PTS)
      .map((s) => ({
        ...s,
        action: suggestedAction(dimension, s.value, s.label),
      })),
  )
    .sort(
      (a, b) =>
        pointsDiff(a.closeRate, baseRate) * a.count -
        pointsDiff(b.closeRate, baseRate) * b.count,
    )
    .slice(0, TOP);
}
