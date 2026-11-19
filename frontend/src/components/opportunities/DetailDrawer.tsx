'use client';

import clsx from 'clsx';
import { ArrowRight, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';
import { createContext, useContext, useEffect, useState } from 'react';
import type { Detail } from '@/lib/opportunity-details';

const DetailContext = createContext<(detail: Detail) => void>(() => {});

/**
 * Envuelve la página de Oportunidades. Un clic en un elemento abre un panel
 * lateral con su detalle, en vez de navegar a otra página sin explicación.
 */
export function DetailProvider({ children }: { children: React.ReactNode }) {
  const [detail, setDetail] = useState<Detail | null>(null);

  return (
    <DetailContext.Provider value={setDetail}>
      {children}
      {detail && (
        <DetailDrawer detail={detail} onClose={() => setDetail(null)} />
      )}
    </DetailContext.Provider>
  );
}

/** Botón que abre el detalle; se ve clicable (borde + flecha al pasar). */
export function DetailButton({
  detail,
  className,
  children,
}: {
  detail: Detail;
  className?: string;
  children: React.ReactNode;
}) {
  const open = useContext(DetailContext);
  return (
    <button
      type="button"
      onClick={() => open(detail)}
      className={clsx('group text-left', className)}
    >
      {children}
      <ChevronRight
        className="text-subtle group-hover:text-brand ml-0.5 inline size-3.5 shrink-0 align-[-2px]"
        aria-hidden
      />
    </button>
  );
}

function DetailDrawer({
  detail,
  onClose,
}: {
  detail: Detail;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40"
      role="dialog"
      aria-modal
      aria-labelledby="detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/20"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <aside className="bg-surface absolute inset-y-0 right-0 flex w-full max-w-md flex-col shadow-2xl">
        <header className="border-border flex items-start justify-between gap-3 border-b p-5">
          <div>
            <p className="text-subtle text-xs font-medium tracking-wide uppercase">
              {detail.eyebrow}
            </p>
            <h2 id="detail-title" className="mt-1 text-lg font-semibold">
              {detail.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-foreground rounded-lg p-1"
            aria-label="Cerrar detalle"
            autoFocus
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <dl className="grid grid-cols-2 gap-3">
            {detail.stats.map((stat) => (
              <div
                key={stat.label}
                className="border-border rounded-lg border p-3"
              >
                <dt className="text-muted text-xs">{stat.label}</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums">
                  {stat.value}
                </dd>
                {stat.hint && (
                  <dd className="text-subtle text-xs">{stat.hint}</dd>
                )}
              </div>
            ))}
          </dl>

          {detail.description && (
            <p className="bg-background rounded-lg p-3 text-sm leading-relaxed">
              {detail.description}
            </p>
          )}

          <nav aria-label="Ir al detalle" className="space-y-2">
            {detail.links.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium',
                  i === 0
                    ? 'bg-brand hover:bg-brand-strong text-white'
                    : 'border-border hover:border-brand/40 border',
                )}
              >
                {link.label}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    </div>
  );
}
