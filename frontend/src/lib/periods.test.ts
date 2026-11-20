import { describe, expect, it } from 'vitest';
import { monthsBetween } from './periods';

describe('monthsBetween', () => {
  it('lista los meses del más reciente al más antiguo, cruzando el año', () => {
    expect(monthsBetween('2024-11-15', '2025-02-03')).toEqual([
      '2025-02',
      '2025-01',
      '2024-12',
      '2024-11',
    ]);
  });

  it('un solo mes si ambas fechas caen en él', () => {
    expect(monthsBetween('2025-03-01', '2025-03-31')).toEqual(['2025-03']);
  });
});
