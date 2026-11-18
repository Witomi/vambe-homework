import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { Env } from '../config/env';
import { CategorizationRecord } from './client.model';

interface StoreFile {
  version: 1;
  items: Record<string, CategorizationRecord>;
}

/**
 * Persistencia de categorizaciones en un archivo JSON.
 *
 * Se escogió JSON versionado en el repo (en vez de una base de datos) porque
 * categorizar tiene costo: el resultado se genera una vez, se comitea y la
 * app desplegada lo lee sin depender del LLM ni de infraestructura extra.
 */
@Injectable()
export class CategorizationStore implements OnModuleInit {
  private readonly logger = new Logger(CategorizationStore.name);
  private readonly path: string;
  private items = new Map<string, CategorizationRecord>();
  private writeQueue: Promise<void> = Promise.resolve();
  /** Se incrementa en cada cambio, para invalidar cachés derivadas. */
  revision = 0;

  constructor(config: ConfigService<Env, true>) {
    this.path = resolve(
      config.get('DATA_DIR', { infer: true }),
      config.get('CATEGORIZATIONS_FILE', { infer: true }),
    );
  }

  async onModuleInit(): Promise<void> {
    if (!existsSync(this.path)) {
      this.logger.warn(
        `No existe ${this.path}: ningún cliente está categorizado aún`,
      );
      return;
    }
    const file = JSON.parse(await readFile(this.path, 'utf8')) as StoreFile;
    this.items = new Map(Object.entries(file.items));
    this.revision++;
    this.logger.log(`${this.items.size} categorizaciones cargadas`);
  }

  get(id: string): CategorizationRecord | undefined {
    return this.items.get(id);
  }

  has(id: string): boolean {
    return this.items.has(id);
  }

  get size(): number {
    return this.items.size;
  }

  /** Guarda en memoria y persiste a disco (escrituras serializadas). */
  async saveMany(records: Record<string, CategorizationRecord>): Promise<void> {
    for (const [id, record] of Object.entries(records)) {
      this.items.set(id, record);
    }
    this.revision++;
    this.writeQueue = this.writeQueue.then(() => this.flush());
    return this.writeQueue;
  }

  /** Escritura atómica: archivo temporal + rename, para no corromper datos. */
  private async flush(): Promise<void> {
    const file: StoreFile = {
      version: 1,
      items: Object.fromEntries(this.items),
    };
    await mkdir(dirname(this.path), { recursive: true });
    const tmp = `${this.path}.tmp`;
    await writeFile(tmp, JSON.stringify(file));
    await rename(tmp, this.path);
  }
}
