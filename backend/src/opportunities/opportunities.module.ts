import { Module } from '@nestjs/common';
import { DataModule } from '../data/data.module';
import { PredictionModule } from '../prediction/prediction.module';
import { OpportunitiesController } from './opportunities.controller';
import { OpportunitiesService } from './opportunities.service';

@Module({
  imports: [DataModule, PredictionModule],
  controllers: [OpportunitiesController],
  providers: [OpportunitiesService],
})
export class OpportunitiesModule {}
