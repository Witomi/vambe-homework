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
    (dimension) => !PRIMARY_DIMENSIONS.includes(dimension.key),
  );
  const hasSecondaryActive = [
    ...secondary.map((dimension) => dimension.key),
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
          onChange={(selection) => setParam('search', selection)}
        />
        <ClosedFilter
          value={searchParams.get('closed') ?? ''}
          onChange={(selection) => setParam('closed', selection)}
        />
        <MultiSelect
          label="Vendedor"
          options={meta.sellers.map((seller) => ({
            value: seller,
            label: seller,
          }))}
          selected={listParam(searchParams, 'sellers')}
          onChange={(selection) => setParam('sellers', selection)}
        />
        <MultiSelect
          label="Nota"
          options={meta.grades}
          selected={listParam(searchParams, 'grade')}
          onChange={(selection) => setParam('grade', selection)}
        />
        {primary.map((dimension) => (
          <MultiSelect
            key={dimension.key}
            label={dimension.label}
            options={dimension.options}
            selected={listParam(searchParams, dimension.key)}
            onChange={(selection) => setParam(dimension.key, selection)}
          />
        ))}
        <button
          type="button"
          onClick={() => setShowMore((shown) => !shown)}
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
              onChange={(event) =>
                setParam('categorized', event.target.checked ? 'true' : null)
              }
            />
            Solo categorizadas por IA
          </label>
          <MultiSelect
            label="Volumen de consultas"
            options={meta.volumeBuckets}
            selected={listParam(searchParams, 'volume')}
            onChange={(selection) => setParam('volume', selection)}
          />
          {secondary.map((dimension) => (
            <MultiSelect
              key={dimension.key}
              label={dimension.label}
              options={dimension.options}
              selected={listParam(searchParams, dimension.key)}
              onChange={(selection) => setParam(dimension.key, selection)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
