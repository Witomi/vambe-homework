'use client';

interface DateRangeFilterProps {
  from: string;
  to: string;
  /** Límites del calendario (rango de fechas del dataset). */
  min?: string;
  max?: string;
  onChange: (from: string, to: string) => void;
}

const INPUT_CLASS =
  'border-border bg-surface text-muted h-9 rounded-lg border px-2 text-sm';

/** Rango de fechas de reunión; cada extremo limita al otro. */
export function DateRangeFilter({
  from,
  to,
  min,
  max,
  onChange,
}: DateRangeFilterProps) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <label className="sr-only" htmlFor="filter-from">
        Desde
      </label>
      <input
        id="filter-from"
        type="date"
        className={INPUT_CLASS}
        value={from}
        min={min}
        max={to || max}
        onChange={(e) => onChange(e.target.value, to)}
      />
      <span className="text-subtle" aria-hidden>
        →
      </span>
      <label className="sr-only" htmlFor="filter-to">
        Hasta
      </label>
      <input
        id="filter-to"
        type="date"
        className={INPUT_CLASS}
        value={to}
        min={from || min}
        max={max}
        onChange={(e) => onChange(from, e.target.value)}
      />
    </div>
  );
}
