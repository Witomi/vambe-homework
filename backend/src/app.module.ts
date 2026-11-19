import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CategorizationModule } from './categorization/categorization.module';
import { ClientsModule } from './clients/clients.module';
import { validateEnv } from './config/env';
import { DataModule } from './data/data.module';
import { HealthModule } from './health/health.module';
import { MetaModule } from './meta/meta.module';
import { MetricsModule } from './metrics/metrics.module';
import { OpportunitiesModule } from './opportunities/opportunities.module';
import { PredictionModule } from './prediction/prediction.module';

/**
 * Módulo raíz.
 *
 * - DataModule:           acceso a datos (CSV + categorizaciones)
 * - ClientsModule:        GET /api/clients
 * - MetricsModule:        GET /api/metrics
 * - OpportunitiesModule:  GET /api/opportunities
 * - PredictionModule:     GET /api/prediction (regresión logística)
 * - MetaModule:           GET /api/meta
 * - HealthModule:         GET /api/health
 * - CategorizationModule: pipeline LLM (usado por el CLI `npm run categorize`)
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    DataModule,
    ClientsModule,
    MetricsModule,
    OpportunitiesModule,
    PredictionModule,
    MetaModule,
    HealthModule,
    CategorizationModule,
  ],
})
export class AppModule {}
