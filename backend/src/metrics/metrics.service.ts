import { Injectable } from '@nestjs/common';
import { ClientFilterDto } from '../filters/client-filter.dto';
import { ClientFilterService } from '../filters/client-filter.service';
import {
  breakdownAllDimensions,
  breakdownByVolume,
  bySeller,
  sellerIndustryMatrix,
  timeline,
} from './aggregations';
import { generateInsights } from './insights';
import { computeKpis } from './kpis';
import { MetricsResponse } from './metrics.types';

@Injectable()
export class MetricsService {
  constructor(private readonly clientFilter: ClientFilterService) {}

  /**
   * Métricas del segmento filtrado.
   * - Métricas de negocio (cierres, vendedores, evolución): todos los clientes.
   * - Métricas basadas en categorías: solo los ya categorizados por el LLM.
   */
  compute(filter: ClientFilterDto): MetricsResponse {
    const clients = this.clientFilter.filter(filter);
    const categorized = clients.filter((c) => c.categories);

    const kpis = computeKpis(clients, categorized);
    const dimensions = breakdownAllDimensions(categorized);
    const sellerIndustry = sellerIndustryMatrix(categorized);

    return {
      kpis,
      timeline: timeline(clients),
      sellers: bySeller(clients),
      dimensions,
      volume: breakdownByVolume(categorized),
      sellerIndustry,
      insights: generateInsights({
        baseRate: kpis.categorizedCloseRate,
        categorizedCount: categorized.length,
        dimensions,
        matrix: sellerIndustry,
      }),
    };
  }
}
