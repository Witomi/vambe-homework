import clsx from 'clsx';

type Tone = 'neutral' | 'brand' | 'good' | 'bad';

const TONES: Record<Tone, string> = {
  neutral: 'bg-background text-muted border-border',
  brand: 'bg-brand-soft text-brand-strong border-transparent',
  good: 'bg-good-soft text-good-strong border-transparent',
  bad: 'bg-negative-soft text-negative-strong border-transparent',
};

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Estado de cierre: color + ícono + texto (nunca solo color). */
export function ClosedBadge({ closed }: { closed: boolean }) {
  return closed ? (
    <Badge tone="good">● Cerrado</Badge>
  ) : (
    <Badge tone="bad">○ No cerrado</Badge>
  );
}
