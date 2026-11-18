import { INestApplication, ValidationPipe } from '@nestjs/common';

/** Configuración HTTP compartida por `main.ts` y los tests e2e. */
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
}
