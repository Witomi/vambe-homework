import { Injectable } from '@nestjs/common';
import { isCategorized } from '../domain/client';
import { ClientFilterService } from '../filters/client-filter.service';
import { breakdownAllDimensions } from '../analytics/breakdown';
import { timeline } from './timeline';
import { generateInsights } from './insights';
import { computeKpis } from './kpis';
import { MetricsResponse } from './metrics.types';
import { compareMonth } from './month-comparison';
import { HISTORIC_PERIOD, MetricsQueryDto } from './dto/metrics-query.dto';
import { sellerPerformance } from '../analytics/seller-performance';

@Injectable()
export class MetricsService {
  constructor(private readonly clientFilter: ClientFilterService) {}

  /**
   * Métricas del segmento filtrado.
   * - Métricas de negocio (cierres, evolución, mes revisado vs. anteriores):
   *   todos los clientes.
   * - Métricas basadas en categorías (incluye vendedores ajustados por
   *   cartera): solo los ya categorizados por el LLM.
   */
  compute(query: MetricsQueryDto): MetricsResponse {
    const { period, ...filter } = query;
    const clients = this.clientFilter.filter(filter);
    const categorized = clients.filter(isCategorized);

    const kpis = computeKpis(clients, categorized);
    const dimensions = breakdownAllDimensions(categorized);

    return {
      kpis,
      monthComparison:
        period === HISTORIC_PERIOD ? null : compareMonth(clients, period),
      timeline: timeline(clients),
      sellers: sellerPerformance(categorized),
      dimensions,
      insights: generateInsights({
        baseRate: kpis.categorizedCloseRate,
        categorizedCount: categorized.length,
        dimensions,
      }),
    };
  }
}
