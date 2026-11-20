import { makeClient } from '../../test/fixtures';
import { Categories } from '../domain/categories';
import { rateStat } from '../analytics/rates';
import { findBlockers } from './blockers';
import { findRecoverableLeads } from './lead-recovery';
import { findReplicableSolutions } from './replicable-solutions';
import { buildSegmentMap } from './segment-map';
import { suggestAssignments } from './seller-assignment';

/** `n` clientes con las mismas categorías, de los cuales `closed` cerraron. */
function group(
  n: number,
  closed: number,
  categories: Partial<Categories>,
  extra: { seller?: string } = {},
) {
  return Array.from({ length: n }, (_, i) =>
    makeClient({ closed: i < closed, categories, ...extra }),
  );
}

const base = (clients: ReturnType<typeof group>) =>
  rateStat(clients).closeRate!;

describe('buildSegmentMap', () => {
  it('clasifica cada grupo según volumen y conversión', () => {
    const clients = [
      ...group(60, 54, { industry: 'salud' }), // mucho volumen, cierra bien
      ...group(20, 18, { industry: 'retail' }), // poco volumen, cierra bien
      ...group(60, 18, { industry: 'educacion' }), // mucho volumen, cierra mal
      ...group(20, 4, { industry: 'turismo' }), // poco volumen, cierra mal
    ];
    const quadrants = buildSegmentMap(clients, base(clients));
    const where = (value: string) =>
      quadrants.find((q) => q.segments.some((s) => s.value === value))?.key;

    expect(where('salud')).toBe('protect');
    expect(where('retail')).toBe('grow');
    expect(where('educacion')).toBe('fix');
    expect(where('turismo')).toBe('deprioritize');
  });

  it('omite grupos que están en el promedio (±3 puntos)', () => {
    const clients = [
      ...group(50, 30, { industry: 'salud' }), // 60%
      ...group(50, 31, { industry: 'retail' }), // 62%
    ];
    const quadrants = buildSegmentMap(clients, base(clients));
    expect(quadrants.flatMap((q) => q.segments)).toEqual([]);
  });
});

describe('findReplicableSolutions', () => {
  it('detecta combinaciones de casos de uso presentes en varias industrias', () => {
    const industries = ['salud', 'retail', 'educacion', 'turismo', 'logistica'];
    const clients = industries.flatMap((industry) =>
      group(4, 3, {
        industry,
        useCases: ['faq', 'agendamiento', 'recordatorios'],
        integrations: ['agenda'],
      }),
    );

    const [solution] = findReplicableSolutions(clients);

    expect(solution.useCases.map((u) => u.value)).toEqual([
      'agendamiento',
      'recordatorios',
    ]);
    expect(solution.industries).toHaveLength(5);
    expect(solution.topIntegration?.value).toBe('agenda');
    expect(solution.clients).toBe(20);
  });

  it('ignora combinaciones de una sola industria', () => {
    const clients = group(30, 20, {
      industry: 'salud',
      useCases: ['agendamiento', 'recordatorios'],
    });
    expect(findReplicableSolutions(clients)).toEqual([]);
  });
});

describe('findRecoverableLeads', () => {
  it('propone los perdidos sobre el promedio, de mayor a menor probabilidad', () => {
    const clients = [
      makeClient({
        id: 'chico',
        closed: false,
        categories: { monthlyInquiries: 100 },
      }),
      makeClient({
        id: 'grande',
        closed: false,
        categories: { monthlyInquiries: 5000 },
      }),
      makeClient({
        id: 'notaA',
        closed: false,
        categories: { monthlyInquiries: 50, industry: 'retail' },
      }),
      makeClient({
        id: 'improbable',
        closed: false,
        categories: { monthlyInquiries: 9000 },
      }),
      makeClient({
        id: 'ganado',
        closed: true,
        categories: { monthlyInquiries: 9999 },
      }),
    ];
    const probabilities: Record<string, number> = {
      chico: 0.72,
      grande: 0.71,
      notaA: 0.8,
      improbable: 0.4,
      ganado: 0.9,
    };
    const scorer = {
      probabilityOf: (id: string) => probabilities[id],
      reasonsFor: () => [
        { label: 'Integraciones: CRM', weight: 0.5, oddsRatio: 1.62 },
      ],
      // El modelo estima que con Toro el lead de nota A ganaría 6 puntos.
      bestSellerFor: (c: { id: string }) =>
        c.id === 'notaA' ? { seller: 'Toro', gainPts: 6 } : null,
    };

    const recovery = findRecoverableLeads(clients, 0.68, scorer);

    // Ni el improbable (40%) ni el que ya cerró. Por probabilidad, aunque
    // el de 80% tenga menos consultas.
    expect(recovery.top.map((l) => l.id)).toEqual(['notaA', 'chico', 'grande']);
    expect(recovery.candidates).toBe(3);
    expect(recovery.top[0].suggestedSeller).toEqual({
      seller: 'Toro',
      gainPts: 6,
    });
    expect(recovery.top[1].suggestedSeller).toBeNull();
    expect(recovery.top[1].reasons).toEqual([
      { label: 'Integraciones: CRM', oddsRatio: 1.62 },
    ]);
  });
});

describe('suggestAssignments', () => {
  it('recomienda al vendedor que mejor convierte cada industria', () => {
    const clients = [
      ...group(10, 9, { industry: 'salud' }, { seller: 'Tiburón' }),
      ...group(10, 5, { industry: 'salud' }, { seller: 'Puma' }),
    ];
    const [assignment] = suggestAssignments(clients);
    expect(assignment).toMatchObject({
      industry: { value: 'salud' },
      seller: 'Tiburón',
      sellerRate: 0.9,
    });
  });

  it('no recomienda si nadie supera claramente al equipo', () => {
    const clients = [
      ...group(10, 7, { industry: 'salud' }, { seller: 'Tiburón' }),
      ...group(10, 7, { industry: 'salud' }, { seller: 'Puma' }),
    ];
    expect(suggestAssignments(clients)).toEqual([]);
  });
});

describe('findBlockers', () => {
  it('lista los rasgos que bajan la conversión con lo que funcionó', () => {
    const sensitive = { requirements: ['datos_sensibles'] };
    const clients = [
      // Con datos sensibles cierran 40%, pero los referidos cierran 83%.
      ...group(12, 10, { ...sensitive, leadSource: 'referido' }),
      ...group(18, 2, { ...sensitive, leadSource: 'google' }),
      ...group(70, 56, { requirements: [] }),
    ];
    const [blocker] = findBlockers(clients, base(clients));
    expect(blocker.value).toBe('datos_sensibles');
    expect(blocker.levers[0]).toMatchObject({
      dimension: 'leadSource',
      value: 'referido',
      count: 12,
      groupRate: 0.4,
    });
  });
});
