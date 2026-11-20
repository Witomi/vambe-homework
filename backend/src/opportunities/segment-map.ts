import { membersOf } from '../analytics/breakdown';
import { findLevers } from '../analytics/levers';
import { pointsDiff } from '../analytics/rates';
import { median } from '../common/collections';
import { formatPct } from '../common/format';
import { CategorizedClient } from '../domain/client';
import { DimensionKey } from '../domain/categories';
import { Quadrant, QuadrantKey, Segment } from './opportunities.types';
import { segmentsOf } from './segments';

/** Dimensiones que el equipo comercial puede atacar directamente. */
const MAP_DIMENSIONS: DimensionKey[] = [
  'industry',
  'leadSource',
  'businessSize',
];

/**
 * Cada cuadrante es una regla sobre los datos: volumen (sobre o bajo la
 * mediana de su dimensión) × conversión (sobre o bajo el promedio). El
 * nombre describe la regla; qué hacer con cada grupo lo decide el equipo.
 */
const QUADRANTS: Record<QuadrantKey, { highVolume: boolean; above: boolean }> =
  {
    protect: { highVolume: true, above: true },
    grow: { highVolume: false, above: true },
    fix: { highVolume: true, above: false },
    deprioritize: { highVolume: false, above: false },
  };

/** Diferencias menores a esto son ruido: el grupo está "en el promedio". */
export const NEUTRAL_BAND_PTS = 3;

/**
 * Mapa volumen × conversión. Cada grupo se compara con los de su misma
 * dimensión: "mucho volumen" = sobre la mediana de su dimensión, y
 * "cierra bien / mal" = al menos 3 puntos sobre / bajo el promedio.
 * Los grupos dentro de esa banda no requieren acción y se omiten.
 */
export function buildSegmentMap(
  categorized: readonly CategorizedClient[],
  baseRate: number,
): Quadrant[] {
  const buckets: Record<QuadrantKey, Segment[]> = {
    protect: [],
    grow: [],
    fix: [],
    deprioritize: [],
  };

  for (const dimension of MAP_DIMENSIONS) {
    const segments = segmentsOf(categorized, dimension);
    const volumeCut = median(segments.map((s) => s.count)) ?? 0;
    for (const segment of segments) {
      const diff = pointsDiff(segment.closeRate, baseRate);
      if (Math.abs(diff) < NEUTRAL_BAND_PTS) continue;
      const highVolume = segment.count >= volumeCut;
      const highRate = diff > 0;
      const key: QuadrantKey = highRate
        ? highVolume
          ? 'protect'
          : 'grow'
        : highVolume
          ? 'fix'
          : 'deprioritize';
      buckets[key].push(segment);
    }
  }

  return (Object.keys(QUADRANTS) as QuadrantKey[]).map((key) => {
    const { highVolume, above } = QUADRANTS[key];
    const side = above ? 'sobre' : 'bajo';
    return {
      key,
      title: `${highVolume ? 'Muchas' : 'Pocas'} reuniones · cierran ${side} el promedio`,
      description: `${highVolume ? 'Sobre' : 'Bajo'} la mediana de reuniones de su dimensión y ${NEUTRAL_BAND_PTS}+ pts ${side} el promedio (${formatPct(baseRate)}).`,
      // Lo más relevante primero: mayor distancia al promedio.
      segments: buckets[key]
        .sort(
          (a, b) =>
            Math.abs(b.closeRate - baseRate) - Math.abs(a.closeRate - baseRate),
        )
        .map((segment) => ({
          ...segment,
          levers: findLevers(
            membersOf(categorized, segment.dimension, segment.value),
            segment.dimension,
          ),
        })),
    };
  });
}
