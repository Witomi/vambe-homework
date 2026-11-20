import { membersOf } from '../analytics/breakdown';
import { findWinningTraits } from '../analytics/winning-traits';
import { pointsDiff } from '../analytics/rates';
import { CategorizedClient } from '../domain/client';
import { DimensionKey } from '../domain/categories';
import { Blocker } from './opportunities.types';
import { segmentsOf } from './segments';

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
 * impacto (puntos perdidos × reuniones afectadas). Cada uno trae sus
 * rasgos ganadores: qué tenían, dentro del grupo, los clientes que sí compraron.
 */
export function findBlockers(
  categorized: readonly CategorizedClient[],
  baseRate: number,
): Blocker[] {
  return BLOCKER_DIMENSIONS.flatMap((dimension) =>
    segmentsOf(categorized, dimension).filter(
      (segment) => pointsDiff(segment.closeRate, baseRate) <= -MIN_DROP_PTS,
    ),
  )
    .sort(
      (segmentA, segmentB) =>
        pointsDiff(segmentA.closeRate, baseRate) * segmentA.count -
        pointsDiff(segmentB.closeRate, baseRate) * segmentB.count,
    )
    .slice(0, TOP)
    .map((segment) => ({
      ...segment,
      winningTraits: findWinningTraits(
        membersOf(categorized, segment.dimension, segment.value),
        segment.dimension,
      ),
    }));
}
