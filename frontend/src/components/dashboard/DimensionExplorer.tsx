'use client';

import { useState } from 'react';
import { listParam } from '@/lib/filters/params';
import { minReliableSample } from '@/lib/metrics';
import type { DimensionKey, Meta, Metrics } from '@/lib/api/types';
import { useFilterParams } from '../filters/useFilterParams';
import { Card } from '../ui/Card';
import { Tabs } from '../ui/Tabs';
import { BreakdownBars, BreakdownMetric } from './BreakdownBars';

type Tab = DimensionKey | 'volume';

const TABS: Tab[] = [
  'industry',
  'leadSource',
  'painPoint',
  'businessSize',
  'volume',
  'urgency',
  'complexity',
  'inquiryChannel',
  'objections',
];

/**
 * Explorador de las dimensiones extraídas por el LLM: permite comparar
 * cuánto pesa cada segmento (demanda) y qué tan bien convierte (cierre).
 */
export function DimensionExplorer({
  meta,
  metrics,
}: {
  meta: Meta;
  metrics: Metrics;
}) {
  const [tab, setTab] = useState<Tab>('industry');
  const [metric, setMetric] = useState<BreakdownMetric>('rate');
  const { searchParams, toggleParamValue } = useFilterParams();

  const dimension = meta.dimensions.find((d) => d.key === tab);
  const rows =
    tab === 'volume'
      ? metrics.volume.filter((r) => r.count)
      : metrics.dimensions[tab];
  const label =
    tab === 'volume' ? 'Volumen de consultas' : (dimension?.label ?? tab);
  const minSample = minReliableSample(metrics.kpis);

  return (
    <Card
      title="Explorador de segmentos"
      subtitle={
        tab === 'volume'
          ? 'Consultas mensuales que el cliente declara recibir. Clic en una fila para filtrar.'
          : `${dimension?.description} Clic en una fila para filtrar.`
      }
      action={
        <Tabs<BreakdownMetric>
          value={metric}
          onChange={setMetric}
          options={[
            { value: 'rate', label: 'Tasa de cierre' },
            { value: 'share', label: 'Demanda (% clientes)' },
          ]}
        />
      }
    >
      <div className="-mx-1 mb-4 overflow-x-auto px-1">
        <Tabs<Tab>
          value={tab}
          onChange={setTab}
          options={TABS.map((t) => ({
            value: t,
            label:
              t === 'volume'
                ? 'Volumen'
                : (meta.dimensions.find((d) => d.key === t)?.label ?? t),
          }))}
        />
      </div>
      <h3 className="sr-only">{label}</h3>
      <BreakdownBars
        rows={rows}
        metric={metric}
        baseRate={metrics.kpis.categorizedCloseRate}
        minSample={minSample}
        onSelect={(value) => toggleParamValue(tab, value)}
        selected={listParam(searchParams, tab)}
      />
    </Card>
  );
}
