'use client';

import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import type { Meta } from '@/lib/api/types';
import { PRIMARY_DIMENSIONS, listParam } from '@/lib/filters/params';
import { findDimension } from '@/lib/labels';
import { ClosedFilter } from './ClosedFilter';
import { DateRangeFilter } from './DateRangeFilter';
import { MultiSelect } from './MultiSelect';
import { SearchInput } from './SearchInput';
import { useFilterParams } from './useFilterParams';

/** Filtros fuera de las dimensiones principales que viven en "Más filtros". */
const SECONDARY_PARAMS = ['volume', 'categorized', 'from', 'to'];

/**
 * Barra de filtros compartida por el panel y la tabla de clientes.
 * Los filtros principales están siempre visibles; el resto de dimensiones
 * extraídas por el LLM se despliegan en "Más filtros".
 */
export function FilterBar({ meta }: { meta: Meta }) {
  const { searchParams, setParam, setParams, isPending } = useFilterParams();

  const primary = PRIMARY_DIMENSIONS.map((key) => findDimension(meta, key));
  const secondary = meta.dimensions.filter(
    (d) => !PRIMARY_DIMENSIONS.includes(d.key),
  );
  const hasSecondaryActive = [
    ...secondary.map((d) => d.key),
    ...SECONDARY_PARAMS,
  ].some((key) => searchParams.get(key));
  const [showMore, setShowMore] = useState(hasSecondaryActive);

  return (
    <div className="border-border bg-surface relative rounded-xl border p-3">
      {isPending && (
        <div
          className="bg-brand absolute inset-x-0 top-0 h-0.5 animate-pulse rounded-t-xl"
          role="progressbar"
          aria-label="Actualizando"
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={searchParams.get('search') ?? ''}
          onChange={(v) => setParam('search', v)}
        />
        <ClosedFilter
          value={searchParams.get('closed') ?? ''}
          onChange={(v) => setParam('closed', v)}
        />
        <MultiSelect
          label="Vendedor"
          options={meta.sellers.map((s) => ({ value: s, label: s }))}
          selected={listParam(searchParams, 'sellers')}
          onChange={(v) => setParam('sellers', v)}
        />
        <MultiSelect
          label="Nota"
          options={meta.grades}
          selected={listParam(searchParams, 'grade')}
          onChange={(v) => setParam('grade', v)}
        />
        {primary.map((d) => (
          <MultiSelect
            key={d.key}
            label={d.label}
            options={d.options}
            selected={listParam(searchParams, d.key)}
            onChange={(v) => setParam(d.key, v)}
          />
        ))}
        <button
          type="button"
          onClick={() => setShowMore((s) => !s)}
          aria-expanded={showMore}
          className="text-muted hover:text-foreground flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm"
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          {showMore ? 'Menos filtros' : 'Más filtros'}
        </button>
      </div>

      {showMore && (
        <div className="border-border mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
          <DateRangeFilter
            from={searchParams.get('from') ?? ''}
            to={searchParams.get('to') ?? ''}
            min={meta.dateRange.from ?? undefined}
            max={meta.dateRange.to ?? undefined}
            onChange={(from, to) => setParams({ from, to })}
          />
          <label className="border-border text-muted flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm">
            <input
              type="checkbox"
              className="accent-brand"
              checked={searchParams.get('categorized') === 'true'}
              onChange={(e) =>
                setParam('categorized', e.target.checked ? 'true' : null)
              }
            />
            Solo categorizadas por IA
          </label>
          <MultiSelect
            label="Volumen de consultas"
            options={meta.volumeBuckets}
            selected={listParam(searchParams, 'volume')}
            onChange={(v) => setParam('volume', v)}
          />
          {secondary.map((d) => (
            <MultiSelect
              key={d.key}
              label={d.label}
              options={d.options}
              selected={listParam(searchParams, d.key)}
              onChange={(v) => setParam(d.key, v)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
