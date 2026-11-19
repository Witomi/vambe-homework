/**
 * Evaluación de la precisión del LLM contra etiquetas humanas.
 *
 *   npm run evaluate -- --init 50   genera data/evaluation/gold.json con 50 casos
 *   npm run evaluate                compara las etiquetas revisadas con el LLM
 *
 * Flujo: el archivo se genera con la respuesta del LLM pre-cargada en
 * `expected`. Una persona revisa cada caso, corrige lo que esté mal y marca
 * `"reviewed": true`. Solo los casos revisados cuentan.
 * (Pre-cargar acelera el etiquetado, pero puede sesgar a quien revisa a
 * aceptar la respuesta; conviene leer la transcripción antes de mirarla.)
 */
import { NestFactory } from '@nestjs/core';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { AppModule } from '../app.module';
import { GoldItem, evaluate } from '../categorization/evaluation/evaluate';
import { seededShuffle } from '../common/sampling';
import { ClientsRepository } from '../data/clients.repository';
import { CategorizedClient } from '../domain/client';
import { Categories } from '../domain/taxonomy';

const GOLD_PATH = resolve('data/evaluation/gold.json');
const pct = (v: number) => `${Math.round(v * 100)}%`;

async function main() {
  const { values } = parseArgs({
    options: {
      init: { type: 'string' },
      seed: { type: 'string', default: '7' },
    },
  });

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['warn', 'error'],
  });
  try {
    const categorized = app.get(ClientsRepository).findCategorized();

    if (values.init) {
      await initGold(categorized, Number(values.init), Number(values.seed));
      return;
    }
    await report(new Map(categorized.map((c) => [c.id, c.categories])));
  } finally {
    await app.close();
  }
}

async function initGold(
  categorized: readonly CategorizedClient[],
  size: number,
  seed: number,
) {
  if (existsSync(GOLD_PATH)) {
    throw new Error(`${GOLD_PATH} ya existe; bórralo para generar uno nuevo.`);
  }
  const items: GoldItem[] = seededShuffle(categorized, seed)
    .slice(0, size)
    .map((c) => ({
      id: c.id,
      transcript: c.transcript,
      reviewed: false,
      expected: c.categories,
    }));
  await mkdir(dirname(GOLD_PATH), { recursive: true });
  await writeFile(GOLD_PATH, JSON.stringify(items, null, 2));
  console.log(
    `Generado ${GOLD_PATH} con ${items.length} casos. Revisa cada uno, corrige ` +
      '"expected" y marca "reviewed": true.',
  );
}

async function report(predicted: Map<string, Categories>) {
  if (!existsSync(GOLD_PATH)) {
    throw new Error(
      'No hay etiquetas. Genera la plantilla con: npm run evaluate -- --init 50',
    );
  }
  const gold = JSON.parse(await readFile(GOLD_PATH, 'utf8')) as GoldItem[];
  const result = evaluate(gold, predicted);
  if (result.evaluated === 0) {
    console.log('Ningún caso marcado como "reviewed": true todavía.');
    return;
  }

  console.log(`Casos evaluados: ${result.evaluated}\n`);
  console.table(
    result.dimensions.map((d) => ({
      Dimensión: d.label,
      'Acierto exacto': pct(d.exactMatch),
      Solapamiento: d.overlap === null ? '—' : pct(d.overlap),
    })),
  );
  console.log(
    `Consultas/mes dentro de ±20%: ${pct(result.inquiriesWithin20Pct)}`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
