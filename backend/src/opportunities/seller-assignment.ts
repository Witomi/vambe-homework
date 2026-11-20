import { groupBy } from '../common/collections';
import { CategorizedClient } from '../domain/client';
import { pointsDiff, rateStat } from '../analytics/rates';
import { MIN_SELLER_INDUSTRY_SAMPLE } from '../analytics/seller-performance';
import { SellerAssignment } from './opportunities.types';
import { segmentsOf } from './segments';

/** Solo se recomienda si el vendedor supera al equipo por al menos esto. */
export const MIN_ADVANTAGE_PTS = 5;
const TOP_INDUSTRIES = 8;

/**
 * Para cada industria frecuente, el vendedor que mejor la convierte.
 * Convierte la matriz vendedor × industria en una regla de asignación
 * directa: "los leads de Salud, a Tiburón".
 */
export function suggestAssignments(
  categorized: readonly CategorizedClient[],
): SellerAssignment[] {
  const industries = segmentsOf(categorized, 'industry')
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_INDUSTRIES);

  return industries
    .flatMap((industry): SellerAssignment[] => {
      const clients = categorized.filter(
        (c) => c.categories.industry === industry.value,
      );
      const bySeller = [...groupBy(clients, (c) => [c.seller]).entries()]
        .filter(([, group]) => group.length >= MIN_SELLER_INDUSTRY_SAMPLE)
        .map(([seller, group]) => ({ seller, ...rateStat(group) }))
        .sort((a, b) => (b.closeRate ?? 0) - (a.closeRate ?? 0));

      const best = bySeller[0];
      if (
        !best ||
        pointsDiff(best.closeRate ?? 0, industry.closeRate) < MIN_ADVANTAGE_PTS
      ) {
        return [];
      }
      return [
        {
          industry: { value: industry.value, label: industry.label },
          seller: best.seller,
          sellerRate: best.closeRate ?? 0,
          sellerMeetings: best.count,
          industryRate: industry.closeRate,
        },
      ];
    })
    .sort(
      (a, b) =>
        pointsDiff(b.sellerRate, b.industryRate) -
        pointsDiff(a.sellerRate, a.industryRate),
    );
}
