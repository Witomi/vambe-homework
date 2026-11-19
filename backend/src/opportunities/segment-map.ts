import { median } from '../common/collections';
import { CategorizedClient } from '../domain/client';
import { DimensionKey } from '../domain/taxonomy';
import { Quadrant, QuadrantKey, Segment } from './opportunities.types';
import { pointsDiff } from '../analytics/rates';
import { segmentsOf } from './segments';

/** Dimensiones que el equipo comercial puede atacar directamente. */
const MAP_DIMENSIONS: DimensionKey[] = [
  'industry',
  'leadSource',
  'businessSize',
];

const QUADRANTS: Record<QuadrantKey, { title: string; action: string }> = {
  protect: {
    title: 'Proteger',
    action:
      'Mucho volumen y cierran bien: son el núcleo del negocio. Mantener el foco y cuidar la experiencia.',
  },
  grow: {
    title: 'Invertir para captar más',
    action:
      'Cierran bien pero llegan pocos: más marketing o prospección aquí rinde más que en cualquier otro lado.',
  },
  fix: {
    title: 'Mejorar el pitch',
    action:
      'Llegan muchos pero cierran poco: revisar la propuesta, la demo o el precio para este grupo.',
  },
  deprioritize: {
    title: 'Despriorizar',
    action:
      'Pocos y cierran poco: no invertir esfuerzo extra hasta resolver lo anterior.',
  },
};

/** Diferencias menores a esto son ruido: el grupo está "en el promedio". */
const NEUTRAL_BAND_PTS = 3;

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

  return (Object.keys(QUADRANTS) as QuadrantKey[]).map((key) => ({
    key,
    ...QUADRANTS[key],
    // Lo más relevante primero: mayor distancia al promedio.
    segments: buckets[key].sort(
      (a, b) =>
        Math.abs(b.closeRate - baseRate) - Math.abs(a.closeRate - baseRate),
    ),
  }));
}
