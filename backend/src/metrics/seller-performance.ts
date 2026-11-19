import { groupBy } from '../common/collections';
import { Client } from '../domain/client';
import { rateStat } from './aggregations';
import { SellerPerformance } from './metrics.types';

/** Rubros con menos reuniones usan la tasa global como referencia. */
const MIN_INDUSTRY_SAMPLE = 10;

/**
 * Desempeño de cada vendedor ajustado por su cartera de rubros.
 *
 * La tasa de cierre cruda castiga a quien recibe rubros difíciles. Aquí se
 * calcula cuánto *se esperaba* que cerrara cada vendedor si hubiera cerrado
 * como el promedio del equipo en cada uno de sus rubros (estandarización
 * directa). La diferencia entre lo real y lo esperado mide la habilidad del
 * vendedor y no la suerte en la asignación.
 */
export function sellerPerformance(
  categorized: readonly Client[],
): SellerPerformance[] {
  const overall = rateStat(categorized).closeRate ?? 0;
  const industryRate = new Map(
    [...groupBy(categorized, (c) => [c.categories!.industry]).entries()].map(
      ([industry, group]) => [
        industry,
        group.length >= MIN_INDUSTRY_SAMPLE
          ? (rateStat(group).closeRate ?? overall)
          : overall,
      ],
    ),
  );

  return [...groupBy(categorized, (c) => [c.seller]).entries()]
    .map(([seller, clients]) => {
      const stats = rateStat(clients);
      const expectedRate =
        clients.reduce(
          (sum, c) => sum + industryRate.get(c.categories!.industry)!,
          0,
        ) / clients.length;
      return {
        seller,
        count: stats.count,
        closed: stats.closed,
        closeRate: stats.closeRate ?? 0,
        expectedRate,
      };
    })
    .sort(
      (a, b) => b.closeRate - b.expectedRate - (a.closeRate - a.expectedRate),
    );
}
