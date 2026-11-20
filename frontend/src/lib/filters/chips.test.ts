import { describe, expect, it } from 'vitest';
import type { Meta } from '../api/types';
import { createLabeler } from '../labels';
import { buildFilterChips } from './chips';

const meta: Meta = {
  dimensions: [
    {
      key: 'industry',
      label: 'Industria',
      description: '',
      multi: false,
      options: [{ value: 'salud', label: 'Salud / Clínicas' }],
    },
  ],
  volumeBuckets: [],
  grades: [],
  notMentioned: { value: 'no_menciona', label: 'No lo menciona' },
  sellers: ['Puma'],
  dateRange: { from: null, to: null },
  categorization: { total: 1, categorized: 1, models: [] },
};

describe('buildFilterChips', () => {
  it('genera chips legibles a partir de la URL', () => {
    const params = new URLSearchParams(
      'search=dental&closed=false&sellers=Puma&industry=salud',
    );
    const chips = buildFilterChips(params, createLabeler(meta), ['industry']);

    expect(chips.map((chip) => `${chip.group}: ${chip.label}`)).toEqual([
      'Búsqueda: “dental”',
      'Estado: No cerrados',
      'Vendedor: Puma',
      'Industria: Salud / Clínicas',
    ]);
    expect(chips.find((chip) => chip.key === 'industry')?.multi).toBe(true);
  });
});
