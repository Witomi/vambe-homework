import { Controller, Get, Query } from '@nestjs/common';
import { ClientFilterDto } from '../filters/client-filter.dto';
import { MetricsService } from './metrics.service';
import type { MetricsResponse } from './metrics.types';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  compute(@Query() filter: ClientFilterDto): MetricsResponse {
    return this.metricsService.compute(filter);
  }
}
