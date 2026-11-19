import { Injectable } from '@nestjs/common';
import { isCategorized } from '../domain/client';
import { ClientFilterDto } from '../filters/client-filter.dto';
import { ClientFilterService } from '../filters/client-filter.service';
import { breakdownAllDimensions } from '../analytics/breakdown';
import { timeline } from './timeline';
import { generateInsights } from './insights';
import { computeKpis } from './kpis';
import { MetricsResponse } from './metrics.types';
import { sellerPerformance } from './seller-performance';

@Injectable()
export class MetricsService {
  constructor(private readonly clientFilter: ClientFilterService) {}

  /**
   * Métricas del segmento filtrado.
   * - Métricas de negocio (cierres, evolución): todos los clientes.
   * - Métricas basadas en categorías (incluye vendedores ajustados por
   *   cartera): solo los ya categorizados por el LLM.
   */
  compute(filter: ClientFilterDto): MetricsResponse {
    const clients = this.clientFilter.filter(filter);
    const categorized = clients.filter(isCategorized);

    const kpis = computeKpis(clients, categorized);
    const dimensions = breakdownAllDimensions(categorized);

    return {
      kpis,
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
