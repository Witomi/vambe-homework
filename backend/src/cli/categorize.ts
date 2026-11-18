/**
 * CLI de categorización.
 *
 *   npm run categorize -- --limit 500 --batch 10 --concurrency 2 --seed 42
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
      limit: { type: 'string', default: '500' },
      batch: { type: 'string', default: '10' },
      concurrency: { type: 'string', default: '2' },
      seed: { type: 'string', default: '42' },
    },
  });
  const toInt = (name: string, v: string) => {
    const n = Number(v);
    if (!Number.isInteger(n) || n <= 0) {
      throw new Error(`--${name} debe ser un entero positivo`);
    }
    return n;
  };
  return {
    limit: toInt('limit', values.limit),
    batchSize: toInt('batch', values.batch),
    concurrency: toInt('concurrency', values.concurrency),
    seed: toInt('seed', values.seed),
  };
}

async function main() {
  const options = readOptions();
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  try {
    const summary = await app.get(CategorizationService).run(options);
    console.table(summary);
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
