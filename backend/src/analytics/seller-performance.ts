import { groupBy } from '../common/collections';
import { CategorizedClient } from '../domain/client';
import { rateStat } from './rates';

/** Rubros con menos reuniones usan la tasa global como referencia. */
const MIN_INDUSTRY_SAMPLE = 10;

/**
 * Mínimo de reuniones de un vendedor en un rubro para comparar su tasa
 * con la del equipo (con menos, una o dos ventas mueven mucho el %).
 */
export const MIN_SELLER_INDUSTRY_SAMPLE = 8;

/** Desempeño de un vendedor frente a lo esperado según su cartera. */
export interface SellerPerformance {
  seller: string;
  count: number;
  closed: number;
  closeRate: number;
  /** Tasa que se esperaba según los leads que recibió (0..1). */
  expectedRate: number;
}

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
  categorized: readonly CategorizedClient[],
): SellerPerformance[] {
  const overall = rateStat(categorized).closeRate ?? 0;
  const industryRate = new Map(
    [
      ...groupBy(categorized, (client) => [
        client.categories.industry,
      ]).entries(),
    ].map(([industry, group]) => [
      industry,
      group.length >= MIN_INDUSTRY_SAMPLE
        ? (rateStat(group).closeRate ?? overall)
        : overall,
    ]),
  );

  return [...groupBy(categorized, (client) => [client.seller]).entries()]
    .map(([seller, clients]) => {
      const stats = rateStat(clients);
      const expectedRate =
        clients.reduce(
          (sum, client) => sum + industryRate.get(client.categories.industry)!,
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
      (performanceA, performanceB) =>
        performanceB.closeRate -
        performanceB.expectedRate -
        (performanceA.closeRate - performanceA.expectedRate),
    );
}
