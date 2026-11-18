'use client';

import clsx from 'clsx';

interface TabsProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
}

export function Tabs<T extends string>({
  value,
  options,
  onChange,
  size = 'sm',
}: TabsProps<T>) {
  return (
    <div
      className="bg-background flex flex-wrap gap-0.5 rounded-lg p-0.5"
      role="tablist"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'rounded-md font-medium transition-colors',
            size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
            o.value === value
              ? 'bg-surface text-foreground shadow-sm'
              : 'text-muted hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
