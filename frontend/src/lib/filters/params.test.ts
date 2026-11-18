import { describe, expect, it } from 'vitest';
import {
  countActiveFilters,
  filterQuery,
  listParam,
  toggleValue,
} from './params';
import { hrefWith } from './url';

describe('filterQuery', () => {
  it('conserva solo los filtros conocidos', () => {
    const query = filterQuery({
      industry: 'salud',
      page: '3',
      cliente: 'abc',
      sellers: ['Puma', 'Toro'],
    });
    expect(query.toString()).toBe('sellers=Puma%2CToro&industry=salud');
  });
});

describe('listParam', () => {
  it('separa valores por coma e ignora vacíos', () => {
    const params = new URLSearchParams('industry=salud,,retail');
    expect(listParam(params, 'industry')).toEqual(['salud', 'retail']);
    expect(listParam(params, 'sellers')).toEqual([]);
  });
});

describe('toggleValue', () => {
  it('agrega si no está y quita si ya estaba', () => {
    expect(toggleValue(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleValue(['a', 'b'], 'a')).toEqual(['b']);
  });
});

describe('countActiveFilters', () => {
  it('cuenta filtros, no paginación', () => {
    const params = new URLSearchParams('industry=salud&closed=true&page=2');
    expect(countActiveFilters(params)).toBe(2);
  });
});

describe('hrefWith', () => {
  it('aplica cambios y elimina los nulos', () => {
    expect(
      hrefWith('/clientes', { industry: 'salud', page: '2' }, { page: null }),
    ).toBe('/clientes?industry=salud');
  });
});
