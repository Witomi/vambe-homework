'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { FILTER_KEYS } from '@/lib/filters';

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
      const qs = next.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router],
  );

  const setParams = useCallback(
    (changes: Record<string, Value>) => {
      const next = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(changes)) {
        const str = Array.isArray(value) ? value.join(',') : value;
        if (str) next.set(key, str);
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

  const clearAll = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    FILTER_KEYS.forEach((k) => next.delete(k));
    navigate(next);
  }, [navigate, searchParams]);

  return { searchParams, setParam, setParams, clearAll, isPending };
}
