'use client';

import { useState } from 'react';
import type { DimensionKey, Meta, Metrics } from '@/lib/api/types';
import { listParam } from '@/lib/filters/params';
import { findDimension } from '@/lib/labels';
import { useFilterParams } from '../filters/useFilterParams';
import { Card } from '../ui/Card';
import { Tabs } from '../ui/Tabs';
import { BreakdownBars } from './BreakdownBars';
import { OutcomeFilterNotice, useOutcomeFiltered } from './OutcomeFilterNotice';

/** Las cuatro formas de agrupar clientes que más le sirven al equipo comercial. */
const TABS: DimensionKey[] = [
  'industry',
  'leadSource',
  'businessSize',
  'painPoint',
];

/** Tasa de cierre de cada grupo de clientes, comparada con el promedio. */
export function DimensionExplorer({
  meta,
  metrics,
}: {
  meta: Meta;
  metrics: Metrics;
}) {
  const [tab, setTab] = useState<DimensionKey>('industry');
  const { searchParams, toggleParamValue } = useFilterParams();
  const outcomeFiltered = useOutcomeFiltered();

  return (
    <Card
      title="¿Qué clientes cierran más?"
      subtitle="Tasa de cierre de cada grupo, sobre las reuniones analizadas con IA. Haz clic en una fila para filtrar."
      action={
        <Tabs<DimensionKey>
          value={tab}
          onChange={setTab}
          options={TABS.map((key) => ({
            value: key,
            label: findDimension(meta, key).label,
          }))}
        />
      }
    >
      {outcomeFiltered ? (
        <OutcomeFilterNotice what="qué grupos cierran más" />
      ) : (
        <BreakdownBars
          rows={metrics.dimensions[tab]}
          metric="rate"
          averageLabel="Promedio analizadas"
          baseRate={metrics.kpis.categorizedCloseRate}
          minSample={metrics.minReliableSample}
          onSelect={(value) => toggleParamValue(tab, value)}
          selected={listParam(searchParams, tab)}
        />
      )}
    </Card>
  );
}
