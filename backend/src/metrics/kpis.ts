import { median } from '../common/collections';
import { CategorizedClient, Client } from '../domain/client';
import { rateStat } from '../analytics/rates';
import { Kpis } from './metrics.types';

/**
 * KPIs del segmento.
 * @param clients     todos los clientes del segmento filtrado
 * @param categorized el subconjunto ya categorizado por el LLM
 */
export function computeKpis(
  clients: readonly Client[],
  categorized: readonly CategorizedClient[],
): Kpis {
  const overall = rateStat(clients);
  const inquiries = categorized
    .map((c) => c.categories.monthlyInquiries)
    .filter((n): n is number => n !== null);

  return {
    meetings: overall.count,
    closed: overall.closed,
    closeRate: overall.closeRate,
    categorized: categorized.length,
    coverage: clients.length ? categorized.length / clients.length : 0,
    categorizedCloseRate: rateStat(categorized).closeRate,
    medianMonthlyInquiries: median(inquiries),
    automatedMonthlyInquiries: categorized
      .filter((c) => c.closed)
      .reduce((sum, c) => sum + (c.categories.monthlyInquiries ?? 0), 0),
  };
}
