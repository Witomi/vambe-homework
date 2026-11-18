import { Bot } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import type { Meta } from '@/lib/api/types';

export function PageHeader({
  title,
  description,
  aside,
}: {
  title: string;
  description: string;
  aside?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted mt-1 text-sm">{description}</p>
      </div>
      {aside}
    </header>
  );
}

/** Aclara sobre cuántos clientes se calculan las métricas basadas en IA. */
export function CoverageNote({ meta }: { meta: Meta }) {
  const { categorized, total, models } = meta.categorization;
  return (
    <p className="border-border bg-surface text-muted flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">
      <Bot className="text-brand size-4 shrink-0" aria-hidden />
      <span>
        <strong className="text-foreground font-medium">
          {formatNumber(categorized)}
        </strong>{' '}
        de {formatNumber(total)} reuniones categorizadas
        {models.length > 0 && <> con {models.join(', ')}</>}
      </span>
    </p>
  );
}
