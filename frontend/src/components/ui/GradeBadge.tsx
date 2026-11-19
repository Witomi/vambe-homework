import clsx from 'clsx';
import type { Grade } from '@/lib/api/types';
import { formatPct } from '@/lib/format';

/** Colores por nota: de más intenso (A) a neutro (D). La letra siempre se ve. */
const STYLES: Record<Grade, string> = {
  A: 'bg-brand-strong text-white',
  B: 'bg-brand text-white',
  C: 'bg-brand-soft text-brand-strong',
  D: 'bg-background text-muted border-border border',
};

/** Nota A–D de un cliente según su probabilidad de cierre. */
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
