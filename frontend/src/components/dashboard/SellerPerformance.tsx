'use client';

import { listParam } from '@/lib/filters/params';
import type { Metrics } from '@/lib/api/types';
import { useFilterParams } from '../filters/useFilterParams';
import { Card } from '../ui/Card';
import { BreakdownBars } from './BreakdownBars';

export function SellerPerformance({ metrics }: { metrics: Metrics }) {
  const { searchParams, toggleParamValue } = useFilterParams();
  const total = metrics.kpis.meetings || 1;
  const rows = metrics.sellers.map((s) => ({
    ...s,
    value: s.seller,
    label: s.seller,
    share: s.count / total,
  }));

  return (
    <Card
      title="Desempeño por vendedor"
      subtitle="Tasa de cierre sobre todas las reuniones del segmento"
    >
      <BreakdownBars
        rows={rows}
        metric="rate"
        baseRate={metrics.kpis.closeRate}
        onSelect={(seller) => toggleParamValue('sellers', seller)}
        selected={listParam(searchParams, 'sellers')}
      />
    </Card>
  );
}
