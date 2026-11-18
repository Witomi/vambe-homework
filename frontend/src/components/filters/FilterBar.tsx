'use client';

import clsx from 'clsx';
import { SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';
import {
  PRIMARY_DIMENSIONS,
  countActiveFilters,
  listParam,
} from '@/lib/filters';
import { createLabeler } from '@/lib/labels';
import type { Meta } from '@/lib/types';
import { MultiSelect } from './MultiSelect';
import { SearchInput } from './SearchInput';
import { useFilterParams } from './useFilterParams';

const CLOSED_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'true', label: 'Cerrados' },
  { value: 'false', label: 'No cerrados' },
];

/**
 * Barra de filtros compartida por el panel y la tabla de clientes.
 * Los filtros principales están siempre visibles; el resto de dimensiones
 * extraídas por el LLM se despliegan en "Más filtros".
 */
export function FilterBar({ meta }: { meta: Meta }) {
  const { searchParams, setParam, setParams, clearAll, isPending } =
    useFilterParams();
  const labels = createLabeler(meta);
  const secondary = meta.dimensions.filter(
    (d) => !PRIMARY_DIMENSIONS.includes(d.key),
  );
  const hasSecondaryActive =
    secondary.some((d) => searchParams.get(d.key)) ||
    ['volume', 'categorized', 'from', 'to'].some((k) => searchParams.get(k));
  const [showMore, setShowMore] = useState(hasSecondaryActive);
  const activeCount = countActiveFilters(searchParams);

  const chips = buildChips(
    searchParams,
    labels,
    meta.dimensions.map((d) => d.key),
  );

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

        <div
          className="border-border flex h-9 rounded-lg border p-0.5"
          role="group"
          aria-label="Estado de cierre"
        >
          {CLOSED_OPTIONS.map((o) => {
            const active = (searchParams.get('closed') ?? '') === o.value;
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={active}
                onClick={() => setParam('closed', o.value)}
                className={clsx(
                  'rounded-md px-2.5 text-sm transition-colors',
                  active
                    ? 'bg-foreground text-white'
                    : 'text-muted hover:text-foreground',
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>

        <MultiSelect
          label="Vendedor"
          options={meta.sellers.map((s) => ({ value: s, label: s }))}
          selected={listParam(searchParams, 'sellers')}
          onChange={(v) => setParam('sellers', v)}
        />

        {PRIMARY_DIMENSIONS.map((key) => {
          const d = meta.dimensions.find((dim) => dim.key === key)!;
          return (
            <MultiSelect
              key={key}
              label={d.label}
              options={d.options}
              selected={listParam(searchParams, key)}
              onChange={(v) => setParam(key, v)}
            />
          );
        })}

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
          <DateRange
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

      {activeCount > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <button
              key={`${chip.key}-${chip.value}`}
              type="button"
              onClick={() =>
                setParam(
                  chip.key,
                  chip.multi
                    ? listParam(searchParams, chip.key).filter(
                        (v) => v !== chip.value,
                      )
                    : null,
                )
              }
              className="bg-background text-muted hover:text-foreground flex items-center gap-1 rounded-full py-0.5 pr-1.5 pl-2.5 text-xs"
            >
              <span className="text-subtle">{chip.dimension}:</span>{' '}
              {chip.label}
              <X className="size-3" aria-label="Quitar filtro" />
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-brand ml-1 text-xs font-medium"
          >
            Limpiar todo
          </button>
        </div>
      )}
    </div>
  );
}

function DateRange(props: {
  from: string;
  to: string;
  min?: string;
  max?: string;
  onChange: (from: string, to: string) => void;
}) {
  const inputClass =
    'border-border bg-surface h-9 rounded-lg border px-2 text-sm text-muted';
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <label className="sr-only" htmlFor="filter-from">
        Desde
      </label>
      <input
        id="filter-from"
        type="date"
        className={inputClass}
        value={props.from}
        min={props.min}
        max={props.to || props.max}
        onChange={(e) => props.onChange(e.target.value, props.to)}
      />
      <span className="text-subtle">→</span>
      <label className="sr-only" htmlFor="filter-to">
        Hasta
      </label>
      <input
        id="filter-to"
        type="date"
        className={inputClass}
        value={props.to}
        min={props.from || props.min}
        max={props.max}
        onChange={(e) => props.onChange(props.from, e.target.value)}
      />
    </div>
  );
}

interface Chip {
  key: string;
  value: string;
  dimension: string;
  label: string;
  multi: boolean;
}

function buildChips(
  params: URLSearchParams,
  labels: ReturnType<typeof createLabeler>,
  dimensionKeys: string[],
): Chip[] {
  const chips: Chip[] = [];
  const search = params.get('search');
  if (search)
    chips.push({
      key: 'search',
      value: search,
      dimension: 'Búsqueda',
      label: `“${search}”`,
      multi: false,
    });
  if (params.get('categorized') === 'true')
    chips.push({
      key: 'categorized',
      value: 'true',
      dimension: 'IA',
      label: 'Solo categorizadas',
      multi: false,
    });
  const closed = params.get('closed');
  if (closed)
    chips.push({
      key: 'closed',
      value: closed,
      dimension: 'Estado',
      label: closed === 'true' ? 'Cerrados' : 'No cerrados',
      multi: false,
    });
  if (params.get('from'))
    chips.push({
      key: 'from',
      value: params.get('from')!,
      dimension: 'Desde',
      label: params.get('from')!,
      multi: false,
    });
  if (params.get('to'))
    chips.push({
      key: 'to',
      value: params.get('to')!,
      dimension: 'Hasta',
      label: params.get('to')!,
      multi: false,
    });
  for (const v of listParam(params, 'sellers'))
    chips.push({
      key: 'sellers',
      value: v,
      dimension: 'Vendedor',
      label: v,
      multi: true,
    });
  for (const v of listParam(params, 'volume'))
    chips.push({
      key: 'volume',
      value: v,
      dimension: 'Volumen',
      label: labels.value('volume', v),
      multi: true,
    });
  for (const key of dimensionKeys) {
    for (const v of listParam(params, key)) {
      chips.push({
        key,
        value: v,
        dimension: labels.dimension(key),
        label: labels.value(key, v),
        multi: true,
      });
    }
  }
  return chips;
}
