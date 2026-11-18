'use client';

import clsx from 'clsx';
import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import type { Option } from '@/lib/api/types';

interface MultiSelectProps {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
}

/** Desplegable con casillas; se cierra con Escape o clic afuera. */
export function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = (value: string) =>
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );

  const summary =
    selected.length === 0
      ? label
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? label)
        : `${label} · ${selected.length}`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'flex h-9 max-w-56 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors',
          selected.length
            ? 'border-brand/40 bg-brand-soft text-brand-strong'
            : 'border-border bg-surface text-muted hover:text-foreground',
        )}
      >
        <span className="truncate">{summary}</span>
        <ChevronDown className="size-3.5 shrink-0" aria-hidden />
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-multiselectable
          aria-label={label}
          className="border-border bg-surface absolute z-20 mt-1 max-h-72 w-64 overflow-auto rounded-lg border p-1 shadow-lg"
        >
          {options.map((o) => {
            const checked = selected.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={checked}
                onClick={() => toggle(o.value)}
                className="hover:bg-background flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm"
              >
                <span
                  className={clsx(
                    'grid size-4 shrink-0 place-items-center rounded border',
                    checked
                      ? 'border-brand bg-brand text-white'
                      : 'border-border',
                  )}
                >
                  {checked && <Check className="size-3" aria-hidden />}
                </span>
                {o.label}
              </button>
            );
          })}
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-brand border-border mt-1 w-full border-t px-2 pt-2 pb-1 text-left text-xs font-medium"
            >
              Quitar selección
            </button>
          )}
        </div>
      )}
    </div>
  );
}
