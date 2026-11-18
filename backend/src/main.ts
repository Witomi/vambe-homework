import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { Env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<Env, true>);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: config.get('FRONTEND_URL', { infer: true }).split(','),
  });
  configureApp(app);

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  Logger.log(`Backend corriendo en http://localhost:${port}/api`, 'Bootstrap');
}
void bootstrap();
