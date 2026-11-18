'use client';

import { formatPct } from '@/lib/format';
import type { Metrics } from '@/lib/types';
import { useFilterParams } from '../filters/useFilterParams';
import { Card } from '../ui/Card';

/** Rampa secuencial azul (claro → oscuro) para la tasa de cierre. */
const RAMP = ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95'];
const MIN_CELL_SAMPLE = 5;

function cellColor(rate: number, min: number, max: number) {
  const t = max > min ? (rate - min) / (max - min) : 0.5;
  const index = Math.min(RAMP.length - 1, Math.floor(t * RAMP.length));
  return { background: RAMP[index], color: index >= 3 ? '#fff' : '#0b0b0b' };
}

/**
 * ¿Qué vendedor convierte mejor cada industria? Sirve para asignar leads
 * entrantes al vendedor con mayor probabilidad de cierre según el rubro.
 */
export function SellerIndustryHeatmap({
  matrix,
}: {
  matrix: Metrics['sellerIndustry'];
}) {
  const { setParams } = useFilterParams();
  const valid = matrix.cells.filter(
    (c) => c.count >= MIN_CELL_SAMPLE && c.closeRate !== null,
  );
  const rates = valid.map((c) => c.closeRate!);
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  const cell = (seller: string, industry: string) =>
    matrix.cells.find((c) => c.seller === seller && c.industry === industry);

  return (
    <Card
      title="Matriz vendedor × industria"
      subtitle={`Tasa de cierre por combinación (celdas con menos de ${MIN_CELL_SAMPLE} reuniones en gris). Úsala para asignar leads según rubro.`}
    >
      {matrix.industries.length === 0 ? (
        <p className="text-muted py-6 text-center text-sm">
          Sin reuniones categorizadas en este segmento.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0.5 text-xs">
            <thead>
              <tr>
                <th className="text-muted bg-surface sticky left-0 px-2 py-1 text-left font-medium">
                  Industria
                </th>
                {matrix.sellers.map((s) => (
                  <th key={s} className="text-muted px-2 py-1 font-medium">
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.industries.map((industry) => (
                <tr key={industry.value}>
                  <th
                    scope="row"
                    className="bg-surface sticky left-0 max-w-40 truncate px-2 py-1 text-left font-normal"
                    title={industry.label}
                  >
                    {industry.label}
                  </th>
                  {matrix.sellers.map((seller) => {
                    const c = cell(seller, industry.value);
                    const enough =
                      c && c.count >= MIN_CELL_SAMPLE && c.closeRate !== null;
                    const style = enough
                      ? cellColor(c.closeRate!, min, max)
                      : { background: '#f0efec', color: '#8a8984' };
                    return (
                      <td key={seller} className="p-0">
                        <button
                          type="button"
                          onClick={() =>
                            setParams({
                              sellers: seller,
                              industry: industry.value,
                            })
                          }
                          title={`${seller} · ${industry.label}: ${c?.closed ?? 0}/${c?.count ?? 0} cerradas`}
                          className="w-full min-w-16 rounded px-2 py-1.5 text-center tabular-nums transition-transform hover:scale-105"
                          style={style}
                        >
                          <span className="block font-medium">
                            {enough ? formatPct(c.closeRate) : '—'}
                          </span>
                          <span className="block text-[10px] opacity-75">
                            n={c?.count ?? 0}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {rates.length > 0 && (
            <div className="text-subtle mt-3 flex items-center gap-2 text-xs">
              <span>{formatPct(min)}</span>
              <span
                className="flex h-2 w-32 overflow-hidden rounded-sm"
                aria-hidden
              >
                {RAMP.map((c) => (
                  <span key={c} className="flex-1" style={{ background: c }} />
                ))}
              </span>
              <span>{formatPct(max)}</span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
