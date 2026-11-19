import { Client } from '../domain/client';
import { DIMENSIONS } from '../domain/taxonomy';
import { gradeOf } from '../prediction/grades';
import { Factor } from '../prediction/prediction.types';
import { LeadRecovery } from './opportunities.types';

const TOP = 10;

/** Lo que el módulo de predicción entrega por cliente. */
export interface LeadScorer {
  probabilityOf(clientId: string): number | undefined;
  reasonsFor(client: Client, max?: number): Factor[];
}

const formatOdds = (odds: number) => `×${odds.toFixed(1).replace('.', ',')}`;

/**
 * Leads perdidos que vale la pena volver a contactar: los que el modelo de
 * regresión logística estima sobre el promedio, empezando por los de mayor
 * volumen de consultas (más valor para Vambe).
 */
export function findRecoverableLeads(
  categorized: readonly Client[],
  baseRate: number,
  scorer: LeadScorer,
): LeadRecovery {
  const scored = categorized
    .filter((c) => !c.closed && c.categories!.monthlyInquiries !== null)
    .flatMap((client) => {
      const winScore = scorer.probabilityOf(client.id);
      if (winScore === undefined || winScore <= baseRate) return [];
      return [
        {
          id: client.id,
          name: client.name,
          seller: client.seller,
          industry:
            DIMENSIONS.industry.options.find(
              (o) => o.value === client.categories!.industry,
            )?.label ?? client.categories!.industry,
          monthlyInquiries: client.categories!.monthlyInquiries!,
          winScore,
          grade: gradeOf(winScore),
          reasons: scorer
            .reasonsFor(client, 2)
            .map((f) => `${f.label} (chances ${formatOdds(f.oddsRatio)})`),
        },
      ];
    });

  return {
    candidates: scored.length,
    monthlyInquiries: scored.reduce((sum, l) => sum + l.monthlyInquiries, 0),
    top: [...scored]
      .sort((a, b) => b.monthlyInquiries - a.monthlyInquiries)
      .slice(0, TOP),
  };
}
