import { Categories } from '../src/categorization/taxonomy';
import { Client } from '../src/data/client.model';

export const baseCategories: Categories = {
  industry: 'salud',
  businessSize: 'mediana',
  leadSource: 'referido',
  inquiryChannel: 'whatsapp',
  painPoint: 'volumen_alto',
  useCases: ['agendamiento'],
  integrations: ['agenda'],
  requirements: [],
  objections: [],
  urgency: 'media',
  complexity: 'media',
  monthlyInquiries: 300,
  summary: 'Clínica que quiere automatizar agendamiento',
};

let seq = 0;

export function makeClient(
  overrides: Partial<Omit<Client, 'categories'>> & {
    categories?: Partial<Categories> | null;
  } = {},
): Client {
  seq++;
  const { categories, ...rest } = overrides;
  return {
    id: `c${seq}`,
    name: `Cliente ${seq}`,
    email: `cliente${seq}@example.com`,
    phone: '56900000000',
    seller: 'Puma',
    meetingDate: '2024-05-10',
    closed: false,
    transcript: 'Somos una clínica dental en Santiago.',
    ...rest,
    categories:
      categories === null ? null : { ...baseCategories, ...categories },
  };
}
