import clsx from 'clsx';
import type { Grade } from '@/lib/api/types';
import { formatPct } from '@/lib/format';

/** Colores por nota: de más intenso (A) a neutro (F). La letra siempre se ve. */
const STYLES: Record<Grade, string> = {
  A: 'bg-brand-strong text-white',
  B: 'bg-brand text-white',
  C: 'bg-brand/70 text-white',
  D: 'bg-brand-soft text-brand-strong',
  E: 'bg-background text-muted border-border border',
  F: 'bg-background text-subtle border-border border border-dashed',
};

/** Nota A–F de un cliente según su probabilidad de cierre. */
export function GradeBadge({
  grade,
  probability,
  size = 'sm',
}: {
  grade: Grade;
  probability?: number;
  size?: 'sm' | 'md';
}) {
  return (
    <span
      title={
        probability === undefined
          ? `Nota ${grade}`
          : `Nota ${grade} · probabilidad de cierre ${formatPct(probability)}`
      }
      className={clsx(
        'inline-grid shrink-0 place-items-center rounded-md font-semibold tabular-nums',
        size === 'sm' ? 'size-6 text-xs' : 'size-9 text-base',
        STYLES[grade],
      )}
    >
      {grade}
    </span>
  );
}
