const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Espacia las llamadas para no superar `rpm` requests por minuto,
 * incluso con varios workers concurrentes compartiendo la instancia.
 */
export class RateLimiter {
  private readonly intervalMs: number;
  private next = 0;

  constructor(rpm: number) {
    this.intervalMs = Math.ceil(60_000 / rpm);
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    const slot = Math.max(now, this.next);
    this.next = slot + this.intervalMs;
    if (slot > now) await sleep(slot - now);
  }

  /** Bloquea a todos los workers (p. ej. tras un 429 del proveedor). */
  pause(ms: number): void {
    this.next = Math.max(this.next, Date.now() + ms);
  }
}

export { sleep };
