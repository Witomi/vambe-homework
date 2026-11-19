import { describe, expect, it } from 'vitest';
import { clientsPageSchema } from './schemas';

const client = {
  id: 'abc',
  name: 'Ana',
  email: 'ana@example.com',
  phone: '569',
  seller: 'Puma',
  meetingDate: '2024-01-01',
  closed: true,
  categories: null,
  prediction: { probability: 0.72, grade: 'B' },
  excerpt: 'Somos una clínica…',
};

describe('clientsPageSchema', () => {
  const page = {
    items: [client],
    total: 1,
    page: 1,
    pageSize: 20,
    totalPages: 1,
  };

  it('acepta una respuesta válida', () => {
    expect(clientsPageSchema.safeParse(page).success).toBe(true);
  });

  it('rechaza una respuesta con campos faltantes o de otro tipo', () => {
    const broken = { ...page, items: [{ ...client, closed: 'sí' }] };
    const result = clientsPageSchema.safeParse(broken);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['items', 0, 'closed']);
  });
});
