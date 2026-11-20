'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { FILTER_KEYS, listParam, toggleValue } from '@/lib/filters/params';

type Value = string | string[] | null | undefined;

/**
 * Lee y escribe filtros en la URL. Cada cambio vuelve a la página 1 y se
 * ejecuta en una transición para mantener la UI responsiva mientras el
 * servidor recalcula métricas.
 */
export function useFilterParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback(
    (next: URLSearchParams) => {
      next.delete('page');
      const query = next.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router],
  );

  const setParams = useCallback(
    (changes: Record<string, Value>) => {
      const next = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(changes)) {
        const serialized = Array.isArray(value) ? value.join(',') : value;
        if (serialized) next.set(key, serialized);
        else next.delete(key);
      }
      navigate(next);
    },
    [navigate, searchParams],
  );

  const setParam = useCallback(
    (key: string, value: Value) => setParams({ [key]: value }),
    [setParams],
  );

  /** Agrega o quita un valor de un filtro de lista (p. ej. clic en una barra). */
  const toggleParamValue = useCallback(
    (key: string, value: string) =>
      setParam(key, toggleValue(listParam(searchParams, key), value)),
    [searchParams, setParam],
  );

  const clearAll = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    FILTER_KEYS.forEach((key) => next.delete(key));
    navigate(next);
  }, [navigate, searchParams]);

  return {
    searchParams,
    setParam,
    setParams,
    toggleParamValue,
    clearAll,
    isPending,
  };
}
