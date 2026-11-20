import { median } from '../utils/collections';
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
  const coverage = clients.length ? categorized.length / clients.length : 0;
  const automated = categorized
    .filter((client) => client.closed)
    .reduce(
      (sum, client) => sum + (client.categories.monthlyInquiries ?? 0),
      0,
    );
  const inquiries = categorized
    .map((client) => client.categories.monthlyInquiries)
    .filter((inquiries): inquiries is number => inquiries !== null);

  return {
    meetings: overall.count,
    closed: overall.closed,
    closeRate: overall.closeRate,
    categorized: categorized.length,
    coverage,
    categorizedCloseRate: rateStat(categorized).closeRate,
    medianMonthlyInquiries: median(inquiries),
    automatedMonthlyInquiries: automated,
    // Con todas las reuniones analizadas (cobertura 100%) es el valor exacto.
    // Con cobertura parcial, escala lo analizado al total: supone que las
    // reuniones analizadas se parecen al resto.
    estimatedAutomatedMonthlyInquiries: coverage ? automated / coverage : null,
  };
}
