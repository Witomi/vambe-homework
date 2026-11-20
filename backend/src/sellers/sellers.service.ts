import { Injectable } from '@nestjs/common';
import { rateStat } from '../analytics/rates';
import {
  MIN_SELLER_INDUSTRY_SAMPLE,
  sellerPerformance,
} from '../analytics/seller-performance';
import { ClientsRepository } from '../data/clients.repository';
import { industryMatrix, sellerHighlights } from './seller-industries';
import { SellersResponse } from './sellers.types';

/**
 * Cómo le va a cada vendedor: su desempeño ajustado por cartera y su tasa
 * de cierre en cada industria frente al equipo. Se calcula sobre todos los
 * clientes analizados con IA (vista global, como Oportunidades).
 */
@Injectable()
export class SellersService {
  constructor(private readonly repository: ClientsRepository) {}

  compute(): SellersResponse {
    const categorized = this.repository.findCategorized();
    const performance = sellerPerformance(categorized);
    const industries = industryMatrix(
      categorized,
      performance.map((performance) => performance.seller),
    );

    return {
      baseRate: rateStat(categorized).closeRate,
      minSample: MIN_SELLER_INDUSTRY_SAMPLE,
      sellers: performance.map((performance, index) => ({
        ...performance,
        ...sellerHighlights(industries, index),
      })),
      industries,
    };
  }
}
