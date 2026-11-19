'use client';

import { useState } from 'react';
import type { DimensionKey, Meta, Metrics } from '@/lib/api/types';
import { listParam } from '@/lib/filters/params';
import { findDimension } from '@/lib/labels';
import { useFilterParams } from '../filters/useFilterParams';
import { Card } from '../ui/Card';
import { Tabs } from '../ui/Tabs';
import { BreakdownBars } from './BreakdownBars';

const TABS: DimensionKey[] = ['useCases', 'integrations'];
const TOP = 6;

/** Lo que más piden los clientes: insumo para producto y preventa. */
export function CustomerNeeds({
  meta,
  metrics,
}: {
  meta: Meta;
  metrics: Metrics;
}) {
  const [tab, setTab] = useState<DimensionKey>('useCases');
  const { searchParams, toggleParamValue } = useFilterParams();

  // Top N de lo que sí mencionan + la fila "No lo menciona" al final,
  // así los porcentajes cubren a todos los clientes.
  const notMentioned = meta.notMentioned.value;
  const rows = metrics.dimensions[tab];
  const topRows = rows
    .filter((r) => r.value !== notMentioned)
    .sort((a, b) => b.share - a.share)
    .slice(0, TOP);
  const notMentionedRow = rows.find((r) => r.value === notMentioned);

  return (
    <Card
      title="¿Qué piden los clientes?"
      subtitle="Porcentaje de clientes que mencionan cada necesidad en la reunión. Un cliente puede mencionar varias."
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
      <BreakdownBars
        rows={notMentionedRow ? [...topRows, notMentionedRow] : topRows}
        trailingValue={notMentioned}
        metric="share"
        baseRate={metrics.kpis.categorizedCloseRate}
        onSelect={(value) => toggleParamValue(tab, value)}
        selected={listParam(searchParams, tab)}
      />
    </Card>
  );
}
