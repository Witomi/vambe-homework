import { Injectable } from '@nestjs/common';
import { ClientsRepository } from '../data/clients.repository';
import { applyFilters } from '../filters/apply-filters';
import { ClientFilterDto } from '../filters/client-filter.dto';
import {
  breakdownAllDimensions,
  breakdownByVolume,
  bySeller,
  median,
  rateStat,
  sellerIndustryMatrix,
  timeline,
} from './aggregations';
import { generateInsights } from './insights';

@Injectable()
export class MetricsService {
  constructor(private readonly repository: ClientsRepository) {}

  /**
   * Métricas del segmento filtrado. Las métricas de negocio (cierres,
   * vendedores, evolución) usan todos los clientes; las basadas en
   * categorías usan solo los ya categorizados por el LLM.
   */
  compute(filter: ClientFilterDto) {
    const clients = applyFilters(this.repository.findAll(), filter, (id) =>
      this.repository.searchableText(id),
    );
    const categorized = clients.filter((c) => c.categories);
    const inquiries = categorized
      .map((c) => c.categories!.monthlyInquiries)
      .filter((n): n is number => n !== null);

    const overall = rateStat(clients);
    const categorizedStats = rateStat(categorized);
    const dimensions = breakdownAllDimensions(categorized);
    const matrix = sellerIndustryMatrix(categorized);

    return {
      kpis: {
        meetings: overall.count,
        closed: overall.closed,
        closeRate: overall.closeRate,
        categorized: categorized.length,
        coverage: clients.length ? categorized.length / clients.length : 0,
        categorizedCloseRate: categorizedStats.closeRate,
        medianMonthlyInquiries: median(inquiries),
        /** Consultas mensuales que los clientes cerrados delegan en Vambe. */
        automatedMonthlyInquiries: categorized
          .filter((c) => c.closed)
          .reduce((sum, c) => sum + (c.categories!.monthlyInquiries ?? 0), 0),
      },
      timeline: timeline(clients),
      sellers: bySeller(clients),
      dimensions,
      volume: breakdownByVolume(categorized),
      sellerIndustry: matrix,
      insights: generateInsights({
        baseRate: categorizedStats.closeRate,
        categorizedCount: categorized.length,
        dimensions,
        matrix,
      }),
    };
  }
}
