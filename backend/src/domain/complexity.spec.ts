import { deriveComplexity } from './complexity';

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
