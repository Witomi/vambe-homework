import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import type { Lever, Segment } from '@/lib/api/types';
import { clientsHref } from '@/lib/filters/url';
import { formatNumber, formatPct, formatPointsDiff } from '@/lib/format';

/**
 * Lo que tenían, dentro de un grupo, los clientes que sí cerraron: rasgos
 * con los que el grupo cierra más que su propio promedio. Cada uno lleva a
 * esas reuniones para leerlas.
 */
export function LeverList({
  segment,
  origin,
}: {
  segment: Segment;
  /** Página de partida, para el "← Volver a …" del destino. */
  origin: string;
}) {
  if (segment.levers.length === 0) {
    return (
      <p className="text-subtle text-xs">
        Ningún rasgo destaca entre los que sí cerraron: con estos datos no hay
        una palanca clara.
      </p>
    );
  }

  return (
    <div>
      <p className="text-muted mb-1.5 text-xs">
        Dentro de este grupo cierran más los que tienen:
      </p>
      <ul className="space-y-1.5">
        {segment.levers.map((lever) => (
          <li key={`${lever.dimension}-${lever.value}`}>
            <LeverRow lever={lever} segment={segment} origin={origin} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function LeverRow({
  lever,
  segment,
  origin,
}: {
  lever: Lever;
  segment: Segment;
  origin: string;
}) {
  // Mismo valor en la misma dimensión de lista: se combinan en el filtro.
  const filter =
    lever.dimension === segment.dimension
      ? { [segment.dimension]: `${segment.value},${lever.value}` }
      : {
          [segment.dimension]: segment.value,
          [lever.dimension]: lever.value,
        };

  return (
    <Link
      href={clientsHref(filter, origin)}
      title={`Ver las ${formatNumber(lever.count)} reuniones con ${segment.label} y ${lever.label}`}
      className="border-border hover:border-brand/40 group flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-md border px-2.5 py-1.5 text-xs"
    >
      <span className="text-subtle">{lever.dimensionLabel}</span>
      <span className="font-medium">{lever.label}</span>
      <span className="ml-auto flex items-center gap-1 tabular-nums">
        cierran {formatPct(lever.closeRate)}
        <span className="text-brand-strong font-medium">
          ({formatPointsDiff(lever.closeRate, lever.groupRate)})
        </span>
        <span className="text-subtle">· {formatNumber(lever.count)}</span>
        <ArrowUpRight
          className="text-subtle group-hover:text-brand size-3.5"
          aria-hidden
        />
      </span>
    </Link>
  );
}
