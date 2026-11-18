import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CategorizationModule } from './categorization/categorization.module';
import { ClientsModule } from './clients/clients.module';
import { validateEnv } from './config/env';
import { DataModule } from './data/data.module';
import { MetaModule } from './meta/meta.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    DataModule,
    ClientsModule,
    MetricsModule,
    MetaModule,
    CategorizationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
