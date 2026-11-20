import { groupBy } from '../common/collections';
import { pointsDiff, rateStat } from '../analytics/rates';
import { MIN_SELLER_INDUSTRY_SAMPLE } from '../analytics/seller-performance';
import { CategorizedClient } from '../domain/client';
import { isActionable, optionLabel } from '../domain/categories';
import {
  IndustryHighlight,
  IndustryResult,
  IndustryRow,
} from './sellers.types';

const resultOf = (clients: readonly CategorizedClient[]): IndustryResult =>
  rateStat(clients);

/**
 * Tabla vendedor × industria: para cada rubro, la tasa de cierre del equipo
 * y la de cada vendedor. Los rubros van de más a menos reuniones y los
 * comodines ("Otro") al final, porque no sirven para decidir nada.
 */
export function industryMatrix(
  categorized: readonly CategorizedClient[],
  sellers: readonly string[],
): IndustryRow[] {
  return [
    ...groupBy(categorized, (client) => [client.categories.industry]).entries(),
  ]
    .sort(
      ([industryA, groupA], [industryB, groupB]) =>
        Number(isActionable(industryB)) - Number(isActionable(industryA)) ||
        groupB.length - groupA.length,
    )
    .map(([industry, clients]) => {
      const bySeller = groupBy(clients, (client) => [client.seller]);
      return {
        industry: { value: industry, label: optionLabel('industry', industry) },
        team: resultOf(clients),
        sellers: sellers.map((seller) => resultOf(bySeller.get(seller) ?? [])),
      };
    });
}

/**
 * Rubros donde el vendedor más supera y más queda bajo el equipo. Solo
 * cuentan rubros accionables con muestra suficiente, y una diferencia de
 * 0 puntos no es ni fortaleza ni debilidad.
 */
export function sellerHighlights(
  rows: readonly IndustryRow[],
  sellerIndex: number,
): { strongest: IndustryHighlight | null; weakest: IndustryHighlight | null } {
  const comparable = rows.flatMap((row): IndustryHighlight[] => {
    const own = row.sellers[sellerIndex];
    if (
      !isActionable(row.industry.value) ||
      own.count < MIN_SELLER_INDUSTRY_SAMPLE ||
      own.closeRate === null ||
      row.team.closeRate === null
    ) {
      return [];
    }
    return [
      {
        industry: row.industry,
        closeRate: own.closeRate,
        teamRate: row.team.closeRate,
        count: own.count,
      },
    ];
  });

  const diff = (highlight: IndustryHighlight) =>
    pointsDiff(highlight.closeRate, highlight.teamRate);
  const sorted = [...comparable].sort(
    (highlightA, highlightB) => diff(highlightB) - diff(highlightA),
  );
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  return {
    strongest: best && diff(best) > 0 ? best : null,
    weakest: worst && diff(worst) < 0 ? worst : null,
  };
}
