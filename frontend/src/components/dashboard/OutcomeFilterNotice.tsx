'use client';

import { useFilterParams } from '../filters/useFilterParams';

/**
 * True si está activo el filtro "Cerrados" o "No cerrados": todos los
 * clientes tienen el mismo resultado y las tasas de cierre no se comparan.
 */
export function useOutcomeFiltered(): boolean {
  return useFilterParams().searchParams.has('closed');
}

/** Explica por qué una comparación de tasas de cierre no se muestra. */
export function OutcomeFilterNotice({ what }: { what: string }) {
  return (
    <p className="text-muted text-sm">
      Con el filtro de cerrados o no cerrados todos los clientes tienen el mismo
      resultado, así que no hay tasas de cierre que comparar. Elige «Todos» para
      ver {what}.
    </p>
  );
}
