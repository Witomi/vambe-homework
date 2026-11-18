import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { normalizeText } from '../common/text';
import { Env } from '../config/env';
import { Client, RawClient } from '../domain/client';
import { CategorizationStore } from './categorization.store';
import { parseClientsCsv } from './csv-loader';

/** Vista de clientes + categorizaciones, recalculada cuando cambia el store. */
interface Snapshot {
  revision: number;
  clients: Client[];
  byId: Map<string, Client>;
}

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
  private snapshot: Snapshot | null = null;

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

  /** Todos los clientes con su categorización (o `null` si aún no la tienen). */
  findAll(): Client[] {
    return this.currentSnapshot().clients;
  }

  findById(id: string): Client | undefined {
    return this.currentSnapshot().byId.get(id);
  }

  /** Filas del CSV sin categorización (para el pipeline del LLM). */
  findRaw(): readonly RawClient[] {
    return this.raw;
  }

  /** Texto normalizado (sin tildes, minúsculas) para búsquedas. */
  searchableText(id: string): string {
    return this.searchIndex.get(id) ?? '';
  }

  private currentSnapshot(): Snapshot {
    if (this.snapshot?.revision !== this.store.revision) {
      const clients = this.raw.map((c) => ({
        ...c,
        categories: this.store.get(c.id)?.categories ?? null,
      }));
      this.snapshot = {
        revision: this.store.revision,
        clients,
        byId: new Map(clients.map((c) => [c.id, c])),
      };
    }
    return this.snapshot;
  }
}
