/**
 * CLI de categorización.
 *
 *   npm run categorize                              # todas las pendientes
 *   npm run categorize -- --limit 500              # solo 500 (p. ej. para probar)
 *   npm run categorize -- --ids a1b2c3,d4e5f6     # recategoriza clientes específicos
 *
 * Es reanudable: solo procesa clientes que aún no tienen categorización,
 * así que se puede cortar (Ctrl+C) y volver a correr sin perder trabajo.
 */
import { NestFactory } from '@nestjs/core';
import { parseArgs } from 'node:util';
import { AppModule } from '../app.module';
import { CategorizationService } from '../categorization/categorization.service';

function readOptions() {
  const { values } = parseArgs({
    options: {
      limit: { type: 'string' },
      batch: { type: 'string', default: '10' },
      concurrency: { type: 'string', default: '5' },
      ids: { type: 'string' },
    },
  });
  const toInt = (name: string, value: string) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Error(`--${name} debe ser un entero positivo`);
    }
    return parsed;
  };
  return {
    limit: values.limit ? toInt('limit', values.limit) : undefined,
    batchSize: toInt('batch', values.batch),
    concurrency: toInt('concurrency', values.concurrency),
    ids: values.ids
      ?.split(',')
      .map((id) => id.trim())
      .filter(Boolean),
  };
}

async function main() {
  const options = readOptions();
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  try {
    const service = app.get(CategorizationService);
    const summary = options.ids
      ? await service.recategorize(options.ids, options)
      : await service.run(options);
    console.table(summary);
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
