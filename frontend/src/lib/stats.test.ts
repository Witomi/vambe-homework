import { describe, expect, it } from 'vitest';
import { wilsonInterval } from './stats';

describe('wilsonInterval', () => {
  it('es amplio con pocas reuniones', () => {
    const { low, high } = wilsonInterval(3, 3);
    expect(low).toBeCloseTo(0.44, 2);
    expect(high).toBe(1);
  });

  it('se estrecha con muchas reuniones', () => {
    const { low, high } = wilsonInterval(790, 1000);
    expect(high - low).toBeLessThan(0.06);
    expect(low).toBeLessThan(0.79);
    expect(high).toBeGreaterThan(0.79);
  });
});
