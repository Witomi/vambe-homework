import { displayedPct } from '../common/format';
import { Client } from '../domain/client';

/**
 * Tasas de cierre y comparaciones entre ellas. Funciones puras compartidas
 * por métricas, oportunidades y predicción.
 */

export interface RateStat {
  count: number;
  closed: number;
  /** 0..1, o null si no hay datos. */
  closeRate: number | null;
}

/** Cantidad, cerradas y tasa de cierre de un grupo de clientes. */
export function rateStat(clients: readonly Client[]): RateStat {
  const closed = clients.filter((c) => c.closed).length;
  return {
    count: clients.length,
    closed,
    closeRate: clients.length ? closed / clients.length : null,
  };
}

/**
 * Diferencia en puntos entre dos tasas, calculada sobre los porcentajes
 * redondeados para que siempre cuadre con lo que se muestra (69% − 68% = 1).
 */
export function pointsDiff(rate: number, base: number): number {
  return displayedPct(rate) - displayedPct(base);
}

/**
 * Mínimo de reuniones para confiar en la tasa de un grupo: una fracción
 * del total, nunca menos de 10 (con menos, "3 de 3" parecería un 100%).
 */
export function minReliableSample(total: number, fraction = 0.02): number {
  return Math.max(10, Math.round(total * fraction));
}
