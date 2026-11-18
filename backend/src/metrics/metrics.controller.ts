import { Controller, Get, Query } from '@nestjs/common';
import { ClientFilterDto } from '../filters/client-filter.dto';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  compute(@Query() filter: ClientFilterDto) {
    return this.metricsService.compute(filter);
  }
}
