import { applyHighVolumeRule, deriveComplexity } from './derived-rules';

const base = { integrations: [], requirements: [], useCases: [] };

describe('deriveComplexity', () => {
  it('baja si solo informa', () => {
    expect(deriveComplexity({ ...base, useCases: ['faq', 'catalogo'] })).toBe(
      'baja',
    );
  });

  it('media con una integración o un flujo transaccional', () => {
    expect(deriveComplexity({ ...base, integrations: ['crm'] })).toBe('media');
    expect(
      deriveComplexity({ ...base, useCases: ['faq', 'agendamiento'] }),
    ).toBe('media');
  });

  it('alta con 2 integraciones, varios idiomas o datos sensibles', () => {
    expect(deriveComplexity({ ...base, integrations: ['crm', 'erp'] })).toBe(
      'alta',
    );
    expect(deriveComplexity({ ...base, requirements: ['multiidioma'] })).toBe(
      'alta',
    );
    expect(
      deriveComplexity({ ...base, requirements: ['datos_sensibles'] }),
    ).toBe('alta');
  });
});

describe('applyHighVolumeRule', () => {
  it('más de 5.000 consultas al mes es volumen alto', () => {
    expect(applyHighVolumeRule('consultas_repetitivas', 7500)).toBe(
      'volumen_alto',
    );
  });

  it('respeta los dolores más prioritarios y el volumen normal', () => {
    expect(applyHighVolumeRule('perdida_ventas', 7500)).toBe('perdida_ventas');
    expect(applyHighVolumeRule('crecimiento', 7500)).toBe('crecimiento');
    expect(applyHighVolumeRule('consultas_repetitivas', 5000)).toBe(
      'consultas_repetitivas',
    );
    expect(applyHighVolumeRule('consultas_repetitivas', null)).toBe(
      'consultas_repetitivas',
    );
  });
});
