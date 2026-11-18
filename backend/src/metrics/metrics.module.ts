import { Module } from '@nestjs/common';
import { FiltersModule } from '../filters/filters.module';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

@Module({
  imports: [FiltersModule],
  controllers: [MetricsController],
  providers: [MetricsService],
})
export class MetricsModule {}
