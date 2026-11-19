import { Controller, Get } from '@nestjs/common';
import { OpportunitiesService } from './opportunities.service';
import type { OpportunitiesResponse } from './opportunities.types';

@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Get()
  compute(): OpportunitiesResponse {
    return this.opportunitiesService.compute();
  }
}
