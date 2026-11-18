import { describe, expect, it } from 'vitest';
import { formatDate, formatMonth, formatPct, formatPp } from './format';

describe('format', () => {
  it('porcentajes y puntos porcentuales', () => {
    expect(formatPct(0.6888, 1)).toBe('68.9%');
    expect(formatPct(null)).toBe('—');
    expect(formatPp(0.04)).toBe('+4 pp');
    expect(formatPp(-0.031)).toBe('−3 pp');
  });

  it('fechas en español', () => {
    expect(formatMonth('2024-03')).toBe('mar 24');
    expect(formatDate('2024-03-05')).toBe('5 mar 2024');
  });
});
