import { Injectable } from '@nestjs/common';
import {
  DIMENSION_KEYS,
  DIMENSIONS,
  NOT_MENTIONED,
  displayOptions,
} from '../domain/categories';
import { VOLUME_BUCKETS } from '../domain/volume';
import { CategorizationStore } from '../data/categorization.store';
import { ClientsRepository } from '../data/clients.repository';
import { GRADES, gradeRange } from '../domain/grades';
import { DimensionMeta, MetaResponse } from './meta.types';

/** Expone la taxonomía y las opciones de filtro para construir la UI. */
@Injectable()
export class MetaService {
  constructor(
    private readonly repository: ClientsRepository,
    private readonly store: CategorizationStore,
  ) {}

  get(): MetaResponse {
    const clients = this.repository.findRaw();
    const dates = clients.map((c) => c.meetingDate).sort();
    const models = new Set(
      clients.flatMap((c) => this.store.get(c.id)?.model ?? []),
    );

    return {
      dimensions: DIMENSION_KEYS.map((key): DimensionMeta => {
        const { label, description, multi } = DIMENSIONS[key];
        return { key, label, description, multi, options: displayOptions(key) };
      }),
      volumeBuckets: VOLUME_BUCKETS.map(({ value, label }) => ({
        value,
        label,
      })),
      grades: GRADES.map(({ grade, title }) => ({
        value: grade,
        label: `${grade} · ${title} (${gradeRange(grade)})`,
      })),
      notMentioned: NOT_MENTIONED,
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
