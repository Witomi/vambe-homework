import { makeClient } from '../../test/fixtures';
import { normalizeText } from '../data/text';
import { applyFilters } from './apply-filters';

const clients = [
  makeClient({
    id: 'a',
    name: 'Ana Pérez',
    seller: 'Puma',
    closed: true,
    meetingDate: '2024-01-15',
    transcript: 'Clínica dental con tres sedes',
    categories: { industry: 'salud', integrations: ['crm', 'agenda'] },
  }),
  makeClient({
    id: 'b',
    seller: 'Toro',
    meetingDate: '2024-06-01',
    transcript: 'Restaurante en Providencia',
    categories: {
      industry: 'gastronomia',
      integrations: ['pos'],
      monthlyInquiries: 6000,
      summary: 'Restaurante que quiere tomar reservas',
    },
  }),
  makeClient({ id: 'c', seller: 'Puma', categories: null }),
];

const text = (id: string) =>
  normalizeText(clients.find((c) => c.id === id)!.transcript);
const ids = (filter: Parameters<typeof applyFilters>[1]) =>
  applyFilters(clients, filter, text).map((c) => c.id);

describe('applyFilters', () => {
  it('sin filtros devuelve todo', () => {
    expect(ids({})).toEqual(['a', 'b', 'c']);
  });

  it('filtra por vendedor, estado y fechas', () => {
    expect(ids({ sellers: ['Puma'] })).toEqual(['a', 'c']);
    expect(ids({ closed: true })).toEqual(['a']);
    expect(ids({ from: '2024-02-01', to: '2024-12-31' })).toEqual(['b', 'c']);
  });

  it('dimensión simple: OR dentro de la dimensión', () => {
    expect(ids({ industry: ['salud', 'gastronomia'] })).toEqual(['a', 'b']);
  });

  it('dimensión múltiple: coincide si contiene alguno', () => {
    expect(ids({ integrations: ['agenda'] })).toEqual(['a']);
  });

  it('AND entre dimensiones distintas', () => {
    expect(ids({ industry: ['salud'], sellers: ['Toro'] })).toEqual([]);
  });

  it('los filtros de categoría excluyen a los no categorizados', () => {
    expect(ids({ categorized: false })).toEqual(['c']);
    expect(ids({ volume: ['muy_alto'] })).toEqual(['b']);
  });

  it('busca sin distinguir tildes ni mayúsculas, en todos los términos', () => {
    expect(ids({ search: 'CLINICA sedes' })).toEqual(['a']);
    expect(ids({ search: 'clinica restaurante' })).toEqual([]);
  });
});
