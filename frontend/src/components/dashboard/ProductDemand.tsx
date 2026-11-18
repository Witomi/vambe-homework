'use client';

import { useState } from 'react';
import { listParam } from '@/lib/filters/params';
import { minReliableSample } from '@/lib/metrics';
import type { DimensionKey, Metrics } from '@/lib/api/types';
import { useFilterParams } from '../filters/useFilterParams';
import { Card } from '../ui/Card';
import { Tabs } from '../ui/Tabs';
import { BreakdownBars, BreakdownMetric } from './BreakdownBars';

const SECTIONS: { key: DimensionKey; title: string; subtitle: string }[] = [
  {
    key: 'useCases',
    title: 'Casos de uso pedidos',
    subtitle: 'Funciones que los clientes esperan del asistente.',
  },
  {
    key: 'integrations',
    title: 'Integraciones solicitadas',
    subtitle:
      'Prioriza el roadmap de conectores según demanda e impacto en el cierre.',
  },
  {
    key: 'requirements',
    title: 'Requisitos clave',
    subtitle: 'Capacidades que el cliente exige del asistente.',
  },
];

/** Señales de producto: qué piden los clientes y qué frena la venta. */
export function ProductDemand({ metrics }: { metrics: Metrics }) {
  const [metric, setMetric] = useState<BreakdownMetric>('share');
  const { searchParams, toggleParamValue } = useFilterParams();
  const minSample = minReliableSample(metrics.kpis);

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Señales de producto</h2>
          <p className="text-muted text-xs">
            Lo que el LLM detectó en las transcripciones, útil para producto y
            preventa.
          </p>
        </div>
        <Tabs<BreakdownMetric>
          value={metric}
          onChange={setMetric}
          options={[
            { value: 'share', label: 'Demanda (% clientes)' },
            { value: 'rate', label: 'Tasa de cierre' },
          ]}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {SECTIONS.map(({ key, title, subtitle }) => (
          <Card key={key} title={title} subtitle={subtitle}>
            <BreakdownBars
              rows={metrics.dimensions[key]}
              metric={metric}
              baseRate={metrics.kpis.categorizedCloseRate}
              minSample={minSample}
              onSelect={(value) => toggleParamValue(key, value)}
              selected={listParam(searchParams, key)}
            />
          </Card>
        ))}
      </div>
    </section>
  );
}
