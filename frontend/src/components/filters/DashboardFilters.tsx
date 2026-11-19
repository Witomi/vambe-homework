'use client';

import type { DimensionKey, Meta } from '@/lib/api/types';
import { listParam } from '@/lib/filters/params';
import { findDimension } from '@/lib/labels';
import { ClosedFilter } from './ClosedFilter';
import { MultiSelect } from './MultiSelect';
import { useFilterParams } from './useFilterParams';

/** Las únicas dimensiones que se filtran desde el panel. */
const DASHBOARD_DIMENSIONS: DimensionKey[] = ['industry', 'leadSource'];

/**
 * Filtros reducidos del panel: estado, vendedor, industria y canal.
 * La búsqueda y el resto de dimensiones viven en la vista de Clientes.
 * Los filtros activos se muestran en `ActiveFiltersBanner`.
 */
export function DashboardFilters({ meta }: { meta: Meta }) {
  const { searchParams, setParam, isPending } = useFilterParams();

  return (
    <div className="relative">
      {isPending && (
        <div
          className="bg-brand absolute inset-x-0 -top-2 h-0.5 animate-pulse rounded"
          role="progressbar"
          aria-label="Actualizando"
        />
      )}
      <div className="flex flex-wrap items-center gap-2">
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
        {DASHBOARD_DIMENSIONS.map((key) => {
          const dimension = findDimension(meta, key);
          return (
            <MultiSelect
              key={key}
              label={dimension.label}
              options={dimension.options}
              selected={listParam(searchParams, key)}
              onChange={(v) => setParam(key, v)}
            />
          );
        })}
      </div>
    </div>
  );
}
