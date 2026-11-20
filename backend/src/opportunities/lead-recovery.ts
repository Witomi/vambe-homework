import { CategorizedClient } from '../domain/client';
import { optionLabel } from '../domain/categories';
import { gradeOf } from '../domain/grades';
import { Factor, SellerSuggestion } from '../prediction/prediction.types';
import { LeadRecovery } from './opportunities.types';

const TOP = 10;

/** Lo que el módulo de predicción entrega por cliente. */
export interface LeadScorer {
  probabilityOf(clientId: string): number | undefined;
  reasonsFor(client: CategorizedClient, max?: number): Factor[];
  bestSellerFor(client: CategorizedClient): SellerSuggestion | null;
}

/**
 * Leads perdidos que vale la pena volver a contactar: los que el modelo de
 * regresión logística estima sobre el promedio. Van de mayor a menor
 * probabilidad de cierre; a igual probabilidad, primero el de más consultas.
 *
 * Si con otro vendedor el modelo estima más probabilidad para ese lead,
 * se sugiere que lo retome él, con los puntos que ganaría.
 */
export function findRecoverableLeads(
  categorized: readonly CategorizedClient[],
  baseRate: number,
  scorer: LeadScorer,
): LeadRecovery {
  const scored = categorized
    .filter(
      (client) => !client.closed && client.categories.monthlyInquiries !== null,
    )
    .flatMap((client) => {
      const winScore = scorer.probabilityOf(client.id);
      if (winScore === undefined || winScore <= baseRate) return [];
      return [
        {
          id: client.id,
          name: client.name,
          seller: client.seller,
          suggestedSeller: scorer.bestSellerFor(client),
          industry: optionLabel('industry', client.categories.industry),
          monthlyInquiries: client.categories.monthlyInquiries!,
          winScore,
          grade: gradeOf(winScore),
          reasons: scorer
            .reasonsFor(client, 2)
            .map(({ label, oddsRatio }) => ({ label, oddsRatio })),
        },
      ];
    });

  return {
    candidates: scored.length,
    monthlyInquiries: scored.reduce(
      (sum, lead) => sum + lead.monthlyInquiries,
      0,
    ),
    top: [...scored]
      .sort(
        (leadA, leadB) =>
          leadB.winScore - leadA.winScore ||
          leadB.monthlyInquiries - leadA.monthlyInquiries,
      )
      .slice(0, TOP),
  };
}
