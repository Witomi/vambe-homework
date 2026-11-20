'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const DEBOUNCE_MS = 350;

/** Búsqueda con debounce: no navega en cada tecla. */
export function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Sincroniza si la URL cambia desde afuera (p. ej. "Limpiar filtros").
  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(
      () => onChangeRef.current(draft.trim()),
      DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [draft, value]);

  return (
    <label className="border-border bg-surface focus-within:border-brand flex h-9 w-full items-center gap-2 rounded-lg border px-3 sm:w-80">
      <Search className="text-subtle size-4 shrink-0" aria-hidden />
      <span className="sr-only">Buscar</span>
      <input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Buscar cliente, email o palabra en la reunión…"
        className="placeholder:text-subtle min-w-0 flex-1 bg-transparent text-sm outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {draft && (
        <button
          type="button"
          onClick={() => setDraft('')}
          aria-label="Limpiar búsqueda"
        >
          <X className="text-subtle hover:text-foreground size-4" />
        </button>
      )}
    </label>
  );
}
