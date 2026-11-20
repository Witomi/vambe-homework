import { describe, expect, it } from 'vitest';
import type { Prediction } from './api/types';
import { gradeRows, probabilityRows } from './prediction';

const bucket = (from: number, closed: number, open: number) => ({
  from,
  to: from + 0.1,
  closed,
  open,
  meanPredicted: from + 0.05,
});

const grade = (letter: 'A' | 'B', count: number, closed: number) =>
  ({
    grade: letter,
    title: `Nota ${letter}`,
    range: '≥ 85%',
    count,
    share: 0.5,
    closed,
    closeRate: closed / count,
    openLeads: count - closed,
    openInquiries: 0,
  }) as Prediction['grades'][number];

describe('probabilityRows', () => {
  it('recorta los tramos vacíos de los extremos y calcula la tasa', () => {
    const rows = probabilityRows([
      bucket(0, 0, 0),
      bucket(0.1, 1, 3),
      bucket(0.2, 0, 0),
      bucket(0.3, 2, 2),
      bucket(0.4, 0, 0),
    ]);
    expect(rows.map((row) => row.label)).toEqual(['10%', '20%', '30%']);
    expect(rows[0]).toMatchObject({ closed: 1, open: 3, closeRate: 0.25 });
    // Un tramo vacío en medio se mantiene (con tasa 0).
    expect(rows[1].closeRate).toBe(0);
  });
});

describe('gradeRows', () => {
  it('ordena de la peor nota a la mejor y separa cerrados de abiertos', () => {
    const rows = gradeRows([grade('A', 10, 9), grade('B', 20, 10)]);
    expect(rows.map((row) => row.label)).toEqual(['B', 'A']);
    expect(rows[1]).toMatchObject({ closed: 9, open: 1, closeRate: 0.9 });
  });
});
