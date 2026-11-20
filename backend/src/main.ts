import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { Env } from './config/env';
import { PredictionService } from './prediction/prediction.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<Env, true>);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: config.get('FRONTEND_URL', { infer: true }).split(','),
  });
  configureApp(app);

  // El modelo de predicción vive en memoria: se entrena antes de aceptar
  // visitas, así nadie espera el entrenamiento (y el health check del
  // hosting solo responde cuando la app está lista).
  await app.init(); // carga el CSV y las categorizaciones
  const trainingMs = app.get(PredictionService).warmUp();
  Logger.log(`Modelo de predicción listo en ${trainingMs} ms`, 'Bootstrap');

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  Logger.log(`Backend corriendo en http://localhost:${port}/api`, 'Bootstrap');
}
void bootstrap();
