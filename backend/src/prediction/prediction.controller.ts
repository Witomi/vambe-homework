import { Controller, Get } from '@nestjs/common';
import { PredictionService } from './prediction.service';
import type { PredictionResponse } from './prediction.types';

@Controller('prediction')
export class PredictionController {
  constructor(private readonly predictionService: PredictionService) {}

  @Get()
  summary(): PredictionResponse {
    return this.predictionService.summary();
  }
}
