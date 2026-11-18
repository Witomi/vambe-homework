'use client';

import clsx from 'clsx';

const OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'true', label: 'Cerrados' },
  { value: 'false', label: 'No cerrados' },
];

/** Control segmentado: todos / cerrados / no cerrados. */
export function ClosedFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      className="border-border flex h-9 rounded-lg border p-0.5"
      role="group"
      aria-label="Estado de cierre"
    >
      {OPTIONS.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={clsx(
              'rounded-md px-2.5 text-sm transition-colors',
              active
                ? 'bg-foreground text-white'
                : 'text-muted hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
