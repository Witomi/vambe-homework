import type { Opportunities, Segment } from './api/types';
import { clientsHref } from './filters/url';
import { formatNumber, formatPct, formatPointsDiff } from './format';

/** Marca la navegación para que el destino muestre "← Volver a Oportunidades". */
export const OPPORTUNITIES_ORIGIN = 'oportunidades';

/** Lo que se muestra al abrir un elemento de Oportunidades. */
export interface Detail {
  /** Contexto pequeño sobre el título, p. ej. "Canal de adquisición". */
  eyebrow: string;
  title: string;
  stats: { label: string; value: string; hint?: string }[];
  /** Qué significa este grupo. */
  description?: string;
  /** Grupo cuyos rasgos ganadores se muestran (qué tenían los que sí cerraron). */
  winningTraitsOf?: Segment;
  /** Destinos explícitos: el usuario elige a dónde ir. */
  links: { label: string; href: string }[];
}

const query = (params: Record<string, string>) =>
  new URLSearchParams(params).toString();

type Filter = Record<string, string>;

/** Enlace al panel filtrado por este grupo. */
const panelLink = (filter: Filter) => ({
  label: 'Ver este grupo en General',
  href: `/?${query({ ...filter, origin: OPPORTUNITIES_ORIGIN })}`,
});

/** Enlace a la lista de clientes (solo los analizados con IA) de este grupo. */
const clientsLink = (filter: Filter, label: string) => ({
  label,
  href: clientsHref(filter, OPPORTUNITIES_ORIGIN),
});

/** Detalle de un grupo de clientes (cuadrante o freno). */
export function segmentDetail(
  segment: Segment,
  baseRate: number,
  description?: string,
): Detail {
  return {
    eyebrow: segment.dimensionLabel,
    title: segment.label,
    stats: [
      {
        label: 'Tasa de cierre',
        value: formatPct(segment.closeRate),
        hint: `${formatPointsDiff(segment.closeRate, baseRate)} vs. promedio (${formatPct(baseRate)})`,
      },
      { label: 'Reuniones', value: formatNumber(segment.count) },
    ],
    description,
    winningTraitsOf: segment,
    links: [
      panelLink({ [segment.dimension]: segment.value }),
      clientsLink(
        { [segment.dimension]: segment.value },
        `Ver sus ${formatNumber(segment.count)} clientes`,
      ),
    ],
  };
}

/** Detalle de una asignación vendedor → rubro. */
export function assignmentDetail(
  a: Opportunities['assignments'][number],
): Detail {
  return {
    eyebrow: 'Top vendedor por industria',
    title: `Leads de ${a.industry.label} → ${a.seller}`,
    stats: [
      {
        label: `${a.seller} en este rubro`,
        value: formatPct(a.sellerRate),
        hint: `${a.sellerMeetings} reuniones`,
      },
      {
        label: 'Equipo en este rubro',
        value: formatPct(a.industryRate),
        hint: `${formatPointsDiff(a.sellerRate, a.industryRate)} a favor de ${a.seller}`,
      },
    ],
    links: [
      panelLink({ industry: a.industry.value }),
      clientsLink(
        { industry: a.industry.value, sellers: a.seller },
        `Ver las reuniones de ${a.seller} en ${a.industry.label}`,
      ),
    ],
  };
}
