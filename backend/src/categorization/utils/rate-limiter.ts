import { sleep } from '../../common/async';

/**
 * Espacia las llamadas para no superar `rpm` requests por minuto,
 * incluso con varios workers concurrentes compartiendo la instancia.
 */
export class RateLimiter {
  private readonly intervalMs: number;
  private nextSlot = 0;

  constructor(rpm: number) {
    this.intervalMs = Math.ceil(60_000 / rpm);
  }

  /** Espera hasta que haya un turno disponible. */
  async acquire(): Promise<void> {
    const now = Date.now();
    const slot = Math.max(now, this.nextSlot);
    this.nextSlot = slot + this.intervalMs;
    if (slot > now) await sleep(slot - now);
  }

  /** Bloquea a todos los workers durante `ms` (p. ej. tras un 429). */
  pause(ms: number): void {
    this.nextSlot = Math.max(this.nextSlot, Date.now() + ms);
  }
}
