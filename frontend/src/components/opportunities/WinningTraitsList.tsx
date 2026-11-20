import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import type { WinningTrait, Segment } from '@/lib/api/types';
import { clientsHref } from '@/lib/filters/url';
import { formatNumber, formatPct, formatPointsDiff } from '@/lib/format';

/**
 * Lo que tenían, dentro de un grupo, los clientes que sí cerraron: rasgos
 * con los que el grupo cierra más que su propio promedio. Cada uno lleva a
 * esas reuniones para leerlas.
 */
export function WinningTraitsList({
  segment,
  origin,
}: {
  segment: Segment;
  /** Página de partida, para el "← Volver a …" del destino. */
  origin: string;
}) {
  if (segment.winningTraits.length === 0) {
    return (
      <p className="text-subtle text-xs">
        Ningún rasgo destaca entre los que sí cerraron en este grupo.
      </p>
    );
  }

  return (
    <div>
      <p className="text-muted mb-1.5 text-xs">
        Dentro de este grupo cierran más los que tienen:
      </p>
      <ul className="space-y-1.5">
        {segment.winningTraits.map((trait) => (
          <li key={`${trait.dimension}-${trait.value}`}>
            <WinningTraitRow trait={trait} segment={segment} origin={origin} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function WinningTraitRow({
  trait,
  segment,
  origin,
}: {
  trait: WinningTrait;
  segment: Segment;
  origin: string;
}) {
  // Mismo valor en la misma dimensión de lista: se combinan en el filtro.
  const filter =
    trait.dimension === segment.dimension
      ? { [segment.dimension]: `${segment.value},${trait.value}` }
      : {
          [segment.dimension]: segment.value,
          [trait.dimension]: trait.value,
        };

  return (
    <Link
      href={clientsHref(filter, origin)}
      title={`Ver las ${formatNumber(trait.count)} reuniones con ${segment.label} y ${trait.label}`}
      className="border-border hover:border-brand/40 group flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-md border px-2.5 py-1.5 text-xs"
    >
      <span className="text-subtle">{trait.dimensionLabel}</span>
      <span className="font-medium">{trait.label}</span>
      <span className="ml-auto flex items-center gap-1 tabular-nums">
        cierran {formatPct(trait.closeRate)}
        <span className="text-brand-strong font-medium">
          ({formatPointsDiff(trait.closeRate, trait.groupRate)})
        </span>
        <span className="text-subtle">· {formatNumber(trait.count)}</span>
        <ArrowUpRight
          className="text-subtle group-hover:text-brand size-3.5"
          aria-hidden
        />
      </span>
    </Link>
  );
}
