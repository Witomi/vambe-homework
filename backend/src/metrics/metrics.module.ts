import { Module } from '@nestjs/common';
import { DataModule } from '../data/data.module';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

@Module({
  imports: [DataModule],
  controllers: [MetricsController],
  providers: [MetricsService],
})
export class MetricsModule {}
