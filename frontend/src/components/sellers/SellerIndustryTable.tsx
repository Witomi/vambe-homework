import clsx from 'clsx';
import Link from 'next/link';
import type {
  IndustryResult,
  IndustryRow,
  SellerSummary,
} from '@/lib/api/types';
import { clientsHref } from '@/lib/filters/url';
import {
  formatNumber,
  formatPct,
  formatPointsDiff,
  pointsDiff,
} from '@/lib/format';
import { Card } from '../ui/Card';
import { SELLERS_ORIGIN } from './SellerCards';

/** Diferencia desde la que una celda se pinta (más chica es ruido). */
const NOTABLE_PTS = 5;

/**
 * Tabla vendedor × industria: primero el volumen de reuniones de cada
 * vendedor y luego su tasa de cierre en cada rubro, comparada con la del
 * equipo en ese mismo rubro. Cada celda lleva a las reuniones que la componen.
 */
export function SellerIndustryTable({
  sellerStats,
  industries,
  minSample,
}: {
  /** En el orden de las columnas. */
  sellerStats: SellerSummary[];
  industries: IndustryRow[];
  minSample: number;
}) {
  const sellers = sellerStats.map((performance) => performance.seller);
  const totalMeetings = sellerStats.reduce(
    (sum, performance) => sum + performance.count,
    0,
  );

  return (
    <Card
      title="¿Cómo le va a cada vendedor en cada industria?"
      subtitle={`Cuántas reuniones tuvo cada vendedor y, por rubro, su tasa de cierre y su diferencia con el equipo en ese mismo rubro. Con menos de ${minSample} reuniones la celda va en gris: es muy poco para concluir. Haz clic en una celda para ver esas reuniones.`}
    >
      <div className="-mx-5 overflow-x-auto px-5">
        <table className="w-full min-w-[40rem] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-muted text-xs">
              <th
                scope="col"
                className="bg-surface sticky left-0 py-2 pr-3 text-left font-medium"
              >
                Industria
              </th>
              <th scope="col" className="px-2 py-2 text-right font-medium">
                Equipo
              </th>
              {sellers.map((seller) => (
                <th
                  key={seller}
                  scope="col"
                  className="px-2 py-2 text-right font-medium"
                >
                  {seller}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th
                scope="row"
                className="bg-surface border-border sticky left-0 border-t py-2 pr-3 text-left font-medium"
              >
                Reuniones
                <span className="text-subtle block text-xs font-normal">
                  analizadas con IA
                </span>
              </th>
              <td className="border-border border-t px-2 py-2 text-right font-semibold tabular-nums">
                {formatNumber(totalMeetings)}
              </td>
              {sellerStats.map((performance) => (
                <td
                  key={performance.seller}
                  className="border-border border-t p-1"
                >
                  <Link
                    href={clientsHref(
                      { sellers: performance.seller },
                      SELLERS_ORIGIN,
                    )}
                    title={`${performance.seller}: ${formatNumber(performance.count)} reuniones analizadas, ${formatPct(performance.count / totalMeetings)} del equipo.`}
                    className="hover:ring-brand/40 block rounded-md px-1.5 py-1 text-right tabular-nums hover:ring-1"
                  >
                    <span className="block font-semibold">
                      {formatNumber(performance.count)}
                    </span>
                    <span className="text-subtle block text-xs">
                      {formatPct(performance.count / totalMeetings)} del total
                    </span>
                  </Link>
                </td>
              ))}
            </tr>
            {industries.map((row) => (
              <tr key={row.industry.value} className="border-border">
                <th
                  scope="row"
                  className="bg-surface border-border sticky left-0 border-t py-2 pr-3 text-left font-normal"
                >
                  <span className="block">{row.industry.label}</span>
                  <span className="text-subtle text-xs">
                    {formatNumber(row.team.count)} reuniones
                  </span>
                </th>
                <td className="border-border border-t px-2 py-2 text-right font-medium tabular-nums">
                  {formatPct(row.team.closeRate)}
                </td>
                {row.sellers.map((result, index) => (
                  <td
                    key={sellers[index]}
                    className="border-border border-t p-1"
                  >
                    <SellerCell
                      result={result}
                      teamRate={row.team.closeRate}
                      minSample={minSample}
                      href={clientsHref(
                        {
                          sellers: sellers[index],
                          industry: row.industry.value,
                        },
                        SELLERS_ORIGIN,
                      )}
                      title={`${sellers[index]} en ${row.industry.label}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-subtle mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5">
          <i
            className="bg-brand-soft inline-block size-3 rounded-sm"
            aria-hidden
          />
          {NOTABLE_PTS}+ puntos sobre el equipo
        </span>
        <span className="flex items-center gap-1.5">
          <i
            className="bg-negative-soft inline-block size-3 rounded-sm"
            aria-hidden
          />
          {NOTABLE_PTS}+ puntos bajo el equipo
        </span>
        <span>— sin reuniones en el rubro</span>
      </p>
    </Card>
  );
}

/** Color de una celda según su diferencia con el equipo, en puntos. */
function toneOf(diffPts: number): 'up' | 'down' | 'even' {
  if (diffPts >= NOTABLE_PTS) return 'up';
  if (diffPts <= -NOTABLE_PTS) return 'down';
  return 'even';
}

function SellerCell({
  result,
  teamRate,
  minSample,
  href,
  title,
}: {
  result: IndustryResult;
  teamRate: number | null;
  minSample: number;
  href: string;
  title: string;
}) {
  if (result.closeRate === null || teamRate === null) {
    return <span className="text-subtle block px-1 py-1 text-right">—</span>;
  }

  const reliable = result.count >= minSample;
  const tone = reliable
    ? toneOf(pointsDiff(result.closeRate, teamRate))
    : 'muted';

  return (
    <Link
      href={href}
      title={`${title}: cerró ${result.closed} de ${result.count} reuniones (${formatPct(result.closeRate)}); el equipo, ${formatPct(teamRate)}.${reliable ? '' : ' Muy pocas reuniones para concluir.'}`}
      className={clsx(
        'hover:ring-brand/40 block rounded-md px-1.5 py-1 text-right tabular-nums hover:ring-1',
        tone === 'up' && 'bg-brand-soft',
        tone === 'down' && 'bg-negative-soft',
        tone === 'muted' && 'text-subtle',
      )}
    >
      <span className="block font-medium">{formatPct(result.closeRate)}</span>
      <span
        className={clsx(
          'block text-xs',
          tone === 'up' && 'text-brand-strong',
          tone === 'down' && 'text-negative-strong',
          (tone === 'even' || tone === 'muted') && 'text-subtle',
        )}
      >
        {reliable
          ? formatPointsDiff(result.closeRate, teamRate)
          : `${result.count} reun.`}
      </span>
    </Link>
  );
}
