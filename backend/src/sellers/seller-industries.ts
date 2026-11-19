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
  return [...groupBy(categorized, (c) => [c.categories.industry]).entries()]
    .sort(
      ([a, ga], [b, gb]) =>
        Number(isActionable(b)) - Number(isActionable(a)) ||
        gb.length - ga.length,
    )
    .map(([industry, clients]) => {
      const bySeller = groupBy(clients, (c) => [c.seller]);
      return {
        industry: { value: industry, label: optionLabel('industry', industry) },
        team: resultOf(clients),
        sellers: sellers.map((s) => resultOf(bySeller.get(s) ?? [])),
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

  const diff = (h: IndustryHighlight) => pointsDiff(h.closeRate, h.teamRate);
  const sorted = [...comparable].sort((a, b) => diff(b) - diff(a));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  return {
    strongest: best && diff(best) > 0 ? best : null,
    weakest: worst && diff(worst) < 0 ? worst : null,
  };
}
