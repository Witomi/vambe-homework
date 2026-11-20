'use client';

import { CalendarDays } from 'lucide-react';
import { formatMonthYear } from '@/lib/format';
import { HISTORIC_PERIOD } from '@/lib/periods';
import { useFilterParams } from '../filters/useFilterParams';

/** Elige qué mes revisar en las cifras clave, o todo el histórico. */
export function PeriodSelect({
  months,
  value,
}: {
  /** Meses disponibles, del más reciente al más antiguo. */
  months: string[];
  value: string;
}) {
  const { setParam, isPending } = useFilterParams();

  return (
    <label className="border-border bg-surface flex h-9 items-center gap-2 rounded-lg border pr-1 pl-3 text-sm">
      <CalendarDays className="text-muted size-4" aria-hidden />
      <span className="text-muted">Período</span>
      <select
        value={value}
        disabled={isPending}
        onChange={(event) => setParam('period', event.target.value)}
        className="h-full cursor-pointer rounded-md bg-transparent pr-1 font-medium focus:outline-none"
      >
        <option value={HISTORIC_PERIOD}>Histórico (todo el período)</option>
        {months.map((month, index) => (
          <option key={month} value={month}>
            {formatMonthYear(month)}
            {index === 0 ? ' (último mes)' : ''}
          </option>
        ))}
      </select>
    </label>
  );
}
