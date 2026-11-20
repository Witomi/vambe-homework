import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Stats, existsSync, unwatchFile, watchFile } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { Env } from '../config/env';
import { CategorizationRecord } from '../domain/client';

/** Cada cuánto se revisa si otro proceso modificó el archivo. */
const WATCH_INTERVAL_MS = 5_000;

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
 *
 * Si otro proceso modifica el archivo (p. ej. `npm run categorize` mientras
 * el servidor corre), el store lo recarga solo y las vistas se actualizan.
 */
@Injectable()
export class CategorizationStore implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CategorizationStore.name);
  private readonly path: string;
  private items = new Map<string, CategorizationRecord>();
  private writeQueue: Promise<void> = Promise.resolve();
  /**
   * El proceso que escribe es dueño del archivo y no lo recarga: podría
   * reemplazar en memoria lotes que aún no terminó de guardar.
   */
  private isWriter = false;
  /** Se incrementa en cada cambio, para invalidar cachés derivadas. */
  revision = 0;

  constructor(config: ConfigService<Env, true>) {
    this.path = resolve(
      config.get('DATA_DIR', { infer: true }),
      config.get('CATEGORIZATIONS_FILE', { infer: true }),
    );
  }

  async onModuleInit(): Promise<void> {
    if (existsSync(this.path)) {
      await this.load();
      this.logger.log(`${this.items.size} categorizaciones cargadas`);
    } else {
      this.logger.warn(
        `No existe ${this.path}: ningún cliente está categorizado aún`,
      );
    }
    // Revisa por fecha de modificación (no por eventos): sigue funcionando
    // aunque cada escritura reemplace el archivo con un rename.
    watchFile(
      this.path,
      { interval: WATCH_INTERVAL_MS, persistent: false },
      (current) => void this.onFileChange(current),
    );
  }

  onModuleDestroy(): void {
    unwatchFile(this.path);
  }

  private async load(): Promise<void> {
    const file = JSON.parse(await readFile(this.path, 'utf8')) as StoreFile;
    this.items = new Map(Object.entries(file.items));
    this.revision++;
  }

  private async onFileChange(current: Stats): Promise<void> {
    if (this.isWriter || current.mtimeMs === 0) return;
    const before = this.items.size;
    try {
      await this.load();
      this.logger.log(
        `Categorizaciones actualizadas: ${this.items.size} (+${this.items.size - before})`,
      );
    } catch (error) {
      this.logger.warn(`No se pudo recargar ${this.path}: ${String(error)}`);
    }
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
    this.isWriter = true;
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
    const tempPath = `${this.path}.tmp`;
    await writeFile(tempPath, JSON.stringify(file));
    await rename(tempPath, this.path);
  }
}
