import { Injectable } from '@nestjs/common';
import { ClientsRepository } from '../data/clients.repository';
import { PredictionService } from '../prediction/prediction.service';
import { rateStat } from '../analytics/rates';
import { findBlockers } from './blockers';
import { findRecoverableLeads } from './lead-recovery';
import { OpportunitiesResponse } from './opportunities.types';
import { findReplicableSolutions } from './replicable-solutions';
import { buildSegmentMap } from './segment-map';
import { suggestAssignments } from './seller-assignment';

/**
 * Convierte las categorías en acciones concretas para el equipo:
 * dónde enfocar el esfuerzo, qué producto construir, a quién volver a
 * llamar, quién toma cada lead y qué frenos resolver.
 * Se calcula sobre todos los clientes categorizados (vista global).
 */
@Injectable()
export class OpportunitiesService {
  constructor(
    private readonly repository: ClientsRepository,
    private readonly prediction: PredictionService,
  ) {}

  compute(): OpportunitiesResponse {
    const categorized = this.repository.findCategorized();
    const baseRate = rateStat(categorized).closeRate;

    if (baseRate === null) {
      return {
        baseRate,
        categorized: 0,
        quadrants: [],
        solutions: [],
        recovery: { candidates: 0, monthlyInquiries: 0, top: [] },
        assignments: [],
        blockers: [],
      };
    }

    return {
      baseRate,
      categorized: categorized.length,
      quadrants: buildSegmentMap(categorized, baseRate),
      solutions: findReplicableSolutions(categorized),
      recovery: findRecoverableLeads(categorized, baseRate, this.prediction),
      assignments: suggestAssignments(categorized),
      blockers: findBlockers(categorized, baseRate),
    };
  }
}
