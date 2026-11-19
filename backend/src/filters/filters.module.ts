import { Module } from '@nestjs/common';
import { DataModule } from '../data/data.module';
import { PredictionModule } from '../prediction/prediction.module';
import { ClientFilterService } from './client-filter.service';

@Module({
  imports: [DataModule, PredictionModule],
  providers: [ClientFilterService],
  exports: [ClientFilterService],
})
export class FiltersModule {}
