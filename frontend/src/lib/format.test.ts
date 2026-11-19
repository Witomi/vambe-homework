import { describe, expect, it } from 'vitest';
import { formatDate, formatMonth, formatPct, formatPointsDiff } from './format';

describe('format', () => {
  it('porcentajes y diferencia en puntos', () => {
    expect(formatPct(0.6888, 1)).toBe('68.9%');
    expect(formatPct(null)).toBe('—');
    expect(formatPointsDiff(0.72, 0.68)).toBe('+4 pts');
    expect(formatPointsDiff(0.65, 0.68)).toBe('−3 pts');
  });

  it('la diferencia cuadra con los porcentajes redondeados que se muestran', () => {
    // 69,4% − 67,6% = 1,8 pts exactos, pero en pantalla se ve 69% vs. 68%.
    expect(formatPct(0.694)).toBe('69%');
    expect(formatPct(0.676)).toBe('68%');
    expect(formatPointsDiff(0.694, 0.676)).toBe('+1 pts');
    // 67,4% vs. 67,6%: ambos se ven como 67% y 68% → −1, no ±0.
    expect(formatPointsDiff(0.674, 0.676)).toBe('−1 pts');
  });

  it('fechas en español', () => {
    expect(formatMonth('2024-03')).toBe('mar 24');
    expect(formatDate('2024-03-05')).toBe('5 mar 2024');
  });
});
