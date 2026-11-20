'use client';

import { ArrowLeft, Filter, X } from 'lucide-react';
import Link from 'next/link';
import type { Meta } from '@/lib/api/types';
import { FilterChip, buildFilterChips } from '@/lib/filters/chips';
import { listParam } from '@/lib/filters/params';
import { createLabeler } from '@/lib/labels';
import { useFilterParams } from './useFilterParams';

/** Páginas que pueden enviar al usuario aquí con `?origin=<clave>` (no es un filtro). */
const ORIGINS: Record<string, { label: string; href: string }> = {
  oportunidades: { label: 'Volver a Oportunidades', href: '/oportunidades' },
  vendedores: { label: 'Volver a Vendedores', href: '/vendedores' },
};

interface ActiveFiltersBannerProps {
  meta: Meta;
  /** Resumen del resultado, p. ej. "112 de 10.000 reuniones". */
  summary: string;
}

/**
 * Banner que deja claro qué filtro se está aplicando, cuánto
 * representa y cómo quitarlo. Solo aparece cuando hay filtros activos.
 */
export function ActiveFiltersBanner({
  meta,
  summary,
}: ActiveFiltersBannerProps) {
  const { searchParams, setParam, clearAll } = useFilterParams();
  const chips = buildFilterChips(
    searchParams,
    createLabeler(meta),
    meta.dimensions.map((dimension) => dimension.key),
  );
  const origin = ORIGINS[searchParams.get('origin') ?? ''];

  if (chips.length === 0) return null;

  const remove = (chip: FilterChip) =>
    setParam(
      chip.key,
      chip.multi
        ? listParam(searchParams, chip.key).filter(
            (value) => value !== chip.value,
          )
        : null,
    );

  return (
    <div
      role="status"
      className="border-brand/30 bg-brand-soft flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-4 py-3"
    >
      {origin && (
        <Link
          href={origin.href}
          className="text-brand-strong flex items-center gap-1 text-sm font-medium hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {origin.label}
        </Link>
      )}
      <span className="text-brand-strong flex items-center gap-1.5 text-sm font-semibold">
        <Filter className="size-4" aria-hidden />
        Viendo solo:
      </span>
      <ul className="flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <li key={`${chip.key}-${chip.value}`}>
            <button
              type="button"
              onClick={() => remove(chip)}
              aria-label={`Quitar filtro ${chip.group}: ${chip.label}`}
              className="bg-surface hover:border-brand/40 flex items-center gap-1 rounded-full border border-transparent py-1 pr-2 pl-3 text-sm shadow-xs"
            >
              <span className="text-muted">{chip.group}:</span>
              <span className="font-medium">{chip.label}</span>
              <X className="text-subtle size-3.5" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <span className="text-muted text-sm tabular-nums">· {summary}</span>
      <button
        type="button"
        onClick={clearAll}
        className="text-brand-strong ml-auto text-sm font-medium hover:underline"
      >
        Quitar filtros
      </button>
    </div>
  );
}
