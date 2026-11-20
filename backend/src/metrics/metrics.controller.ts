import { Controller, Get, Query } from '@nestjs/common';
import { MetricsQueryDto } from './dto/metrics-query.dto';
import { MetricsService } from './metrics.service';
import type { MetricsResponse } from './metrics.types';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  compute(@Query() query: MetricsQueryDto): MetricsResponse {
    return this.metricsService.compute(query);
  }
}
