import { Injectable } from '@nestjs/common';
import { ClientsRepository } from '../data/clients.repository';
import { PredictionService } from '../prediction/prediction.service';
import { rateStat } from '../analytics/rates';
import { findBlockers } from './blockers';
import { findRecoverableLeads } from './lead-recovery';
import { MIN_SELLER_INDUSTRY_SAMPLE } from '../analytics/seller-performance';
import { OpportunitiesResponse, OpportunityRules } from './opportunities.types';
import {
  MIN_INDUSTRIES,
  findReplicableSolutions,
} from './replicable-solutions';
import { NEUTRAL_BAND_PTS, buildSegmentMap } from './segment-map';
import { MIN_ADVANTAGE_PTS, suggestAssignments } from './seller-assignment';

const RULES: OpportunityRules = {
  neutralBandPts: NEUTRAL_BAND_PTS,
  minAdvantagePts: MIN_ADVANTAGE_PTS,
  minSellerMeetings: MIN_SELLER_INDUSTRY_SAMPLE,
  minSolutionIndustries: MIN_INDUSTRIES,
};

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
        rules: RULES,
        categorized: 0,
        quadrants: [],
        solutions: [],
        recovery: { candidates: 0, monthlyInquiries: 0, top: [] },
        assignments: [],
        blockers: [],
      };
    }

    const assignments = suggestAssignments(categorized);
    return {
      baseRate,
      rules: RULES,
      categorized: categorized.length,
      quadrants: buildSegmentMap(categorized, baseRate),
      solutions: findReplicableSolutions(categorized),
      recovery: findRecoverableLeads(categorized, baseRate, this.prediction),
      assignments,
      blockers: findBlockers(categorized, baseRate),
    };
  }
}
