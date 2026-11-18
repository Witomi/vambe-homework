'use client';

import { listParam } from '@/lib/filters';
import type { Metrics } from '@/lib/types';
import { useFilterParams } from '../filters/useFilterParams';
import { Card } from '../ui/Card';
import { BreakdownBars } from './BreakdownBars';

export function SellerPerformance({ metrics }: { metrics: Metrics }) {
  const { searchParams, setParam } = useFilterParams();
  const total = metrics.kpis.meetings || 1;
  const rows = metrics.sellers.map((s) => ({
    ...s,
    value: s.seller,
    label: s.seller,
    share: s.count / total,
  }));

  const toggle = (seller: string) => {
    const current = listParam(searchParams, 'sellers');
    setParam(
      'sellers',
      current.includes(seller)
        ? current.filter((v) => v !== seller)
        : [...current, seller],
    );
  };

  return (
    <Card
      title="Desempeño por vendedor"
      subtitle="Tasa de cierre sobre todas las reuniones del segmento"
    >
      <BreakdownBars
        rows={rows}
        metric="rate"
        baseRate={metrics.kpis.closeRate}
        onSelect={toggle}
        selected={listParam(searchParams, 'sellers')}
      />
    </Card>
  );
}
