import { Injectable } from '@nestjs/common';
import { DIMENSION_KEYS, DIMENSIONS, VOLUME_BUCKETS } from '../domain/taxonomy';
import { CategorizationStore } from '../data/categorization.store';
import { ClientsRepository } from '../data/clients.repository';

@Injectable()
export class MetaService {
  constructor(
    private readonly repository: ClientsRepository,
    private readonly store: CategorizationStore,
  ) {}

  get() {
    const clients = this.repository.findRaw();
    const dates = clients.map((c) => c.meetingDate).sort();
    const models = new Set(
      clients.flatMap((c) => this.store.get(c.id)?.model ?? []),
    );

    return {
      dimensions: DIMENSION_KEYS.map((key) => {
        const { label, description, multi, options } = DIMENSIONS[key];
        return { key, label, description, multi, options };
      }),
      volumeBuckets: VOLUME_BUCKETS.map(({ value, label }) => ({
        value,
        label,
      })),
      sellers: [...new Set(clients.map((c) => c.seller))].sort(),
      dateRange: { from: dates[0] ?? null, to: dates.at(-1) ?? null },
      categorization: {
        total: clients.length,
        categorized: this.store.size,
        models: [...models],
      },
    };
  }
}
