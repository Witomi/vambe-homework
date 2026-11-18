import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Env } from '../config/env';
import { normalizeText } from './text';
import { CategorizationStore } from './categorization.store';
import { Client, RawClient } from './client.model';
import { parseClientsCsv } from './csv-loader';

/**
 * Repositorio en memoria de clientes. Con ~10k filas, mantener todo en
 * memoria permite filtrar y agregar en milisegundos sin una base de datos.
 * Si el volumen creciera, bastaría con reimplementar esta clase sobre SQL.
 */
@Injectable()
export class ClientsRepository implements OnModuleInit {
  private readonly logger = new Logger(ClientsRepository.name);
  private readonly csvPath: string;
  private raw: RawClient[] = [];
  private searchIndex = new Map<string, string>();
  private cache: { revision: number; clients: Client[] } | null = null;

  constructor(
    config: ConfigService<Env, true>,
    private readonly store: CategorizationStore,
  ) {
    this.csvPath = resolve(
      config.get('DATA_DIR', { infer: true }),
      config.get('CLIENTS_CSV', { infer: true }),
    );
  }

  async onModuleInit(): Promise<void> {
    this.raw = parseClientsCsv(await readFile(this.csvPath, 'utf8'));
    this.searchIndex = new Map(
      this.raw.map((c) => [
        c.id,
        normalizeText([c.name, c.email, c.phone, c.transcript].join(' ')),
      ]),
    );
    this.logger.log(`${this.raw.length} clientes cargados desde el CSV`);
  }

  /** Todos los clientes con su categorización; cacheado por revisión. */
  findAll(): Client[] {
    if (this.cache?.revision !== this.store.revision) {
      this.cache = {
        revision: this.store.revision,
        clients: this.raw.map((c) => ({
          ...c,
          categories: this.store.get(c.id)?.categories ?? null,
        })),
      };
    }
    return this.cache.clients;
  }

  findById(id: string): Client | undefined {
    return this.findAll().find((c) => c.id === id);
  }

  findRaw(): readonly RawClient[] {
    return this.raw;
  }

  /** Texto normalizado (sin tildes, minúsculas) para búsquedas. */
  searchableText(id: string): string {
    return this.searchIndex.get(id) ?? '';
  }
}
