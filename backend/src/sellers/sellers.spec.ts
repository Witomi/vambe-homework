import { makeClient } from '../../test/fixtures';
import { industryMatrix, sellerHighlights } from './seller-industries';

/** `n` reuniones de un vendedor en un rubro, de las cuales `closed` cerraron. */
function meetings(
  seller: string,
  industry: string,
  count: number,
  closed: number,
) {
  return Array.from({ length: count }, (_, index) =>
    makeClient({ seller, closed: index < closed, categories: { industry } }),
  );
}

describe('industryMatrix', () => {
  const clients = [
    ...meetings('Ana', 'salud', 10, 9),
    ...meetings('Beto', 'salud', 10, 5),
    ...meetings('Ana', 'retail', 4, 1),
    ...meetings('Beto', 'otro', 30, 15),
  ];
  const rows = industryMatrix(clients, ['Ana', 'Beto']);

  it('ordena por reuniones y deja "Otro" al final', () => {
    expect(rows.map((row) => row.industry.value)).toEqual([
      'salud',
      'retail',
      'otro',
    ]);
    expect(rows[0].industry.label).not.toBe('salud');
  });

  it('calcula la tasa del equipo y de cada vendedor en el rubro', () => {
    const salud = rows[0];
    expect(salud.team).toEqual({ count: 20, closed: 14, closeRate: 0.7 });
    expect(salud.sellers.map((result) => result.closeRate)).toEqual([0.9, 0.5]);
  });

  it('marca sin datos a un vendedor sin reuniones en el rubro', () => {
    expect(rows[1].sellers[1]).toEqual({
      count: 0,
      closed: 0,
      closeRate: null,
    });
  });
});

describe('sellerHighlights', () => {
  it('elige el rubro donde más supera y más queda bajo el equipo', () => {
    const clients = [
      ...meetings('Ana', 'salud', 10, 9),
      ...meetings('Beto', 'salud', 10, 5),
      ...meetings('Ana', 'retail', 10, 2),
      ...meetings('Beto', 'retail', 10, 6),
    ];
    const rows = industryMatrix(clients, ['Ana', 'Beto']);

    const ana = sellerHighlights(rows, 0);
    expect(ana.strongest?.industry.value).toBe('salud');
    expect(ana.weakest?.industry.value).toBe('retail');
  });

  it('ignora rubros con poca muestra y los comodines', () => {
    const clients = [
      ...meetings('Ana', 'salud', 3, 3),
      ...meetings('Beto', 'salud', 10, 2),
      ...meetings('Ana', 'otro', 20, 20),
      ...meetings('Beto', 'otro', 20, 2),
    ];
    const rows = industryMatrix(clients, ['Ana', 'Beto']);

    expect(sellerHighlights(rows, 0)).toEqual({
      strongest: null,
      weakest: null,
    });
  });
});
