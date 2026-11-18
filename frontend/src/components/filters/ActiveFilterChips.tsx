'use client';

import { X } from 'lucide-react';
import type { FilterChip } from '@/lib/filters/chips';

interface ActiveFilterChipsProps {
  chips: FilterChip[];
  onRemove: (chip: FilterChip) => void;
  onClearAll: () => void;
}

/** Fila de filtros activos; cada chip se puede quitar individualmente. */
export function ActiveFilterChips({
  chips,
  onRemove,
  onClearAll,
}: ActiveFilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <button
          key={`${chip.key}-${chip.value}`}
          type="button"
          onClick={() => onRemove(chip)}
          className="bg-background text-muted hover:text-foreground flex items-center gap-1 rounded-full py-0.5 pr-1.5 pl-2.5 text-xs"
        >
          <span className="text-subtle">{chip.group}:</span> {chip.label}
          <X className="size-3" aria-label="Quitar filtro" />
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-brand ml-1 text-xs font-medium"
      >
        Limpiar todo
      </button>
    </div>
  );
}
