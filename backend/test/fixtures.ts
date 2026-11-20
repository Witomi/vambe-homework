import { Categories } from '../src/domain/categories';
import { CategorizedClient, Client } from '../src/domain/client';

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
  seasonality: 'sin_peaks',
  monthlyInquiries: 300,
  peakMonthlyInquiries: null,
  summary: 'Clínica que quiere automatizar agendamiento',
};

let seq = 0;

type ClientOverrides = Partial<Omit<Client, 'categories'>>;

/**
 * Cliente de prueba. Por defecto viene categorizado (con `baseCategories`
 * más los cambios indicados); con `categories: null` simula uno sin
 * categorizar.
 */
export function makeClient(
  overrides: ClientOverrides & { categories: null },
): Client;
export function makeClient(
  overrides?: ClientOverrides & { categories?: Partial<Categories> },
): CategorizedClient;
export function makeClient(
  overrides: ClientOverrides & {
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
