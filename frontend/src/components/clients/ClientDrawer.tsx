import { Bot, Calendar, Mail, Phone, UserRound, X } from 'lucide-react';
import Link from 'next/link';
import type { SearchParams } from '@/lib/filters';
import { formatDate, formatNumber } from '@/lib/format';
import type { ClientDetail, Meta } from '@/lib/types';
import { hrefWith } from '@/lib/url';
import { Badge, ClosedBadge } from '../ui/Badge';
import { DrawerEscape } from './DrawerEscape';

/** Detalle del cliente: transcripción original junto a su categorización. */
export function ClientDrawer({
  client,
  meta,
  params,
}: {
  client: ClientDetail;
  meta: Meta;
  params: SearchParams;
}) {
  const closeHref = hrefWith('/clientes', params, { cliente: null });
  const c = client.categories;

  return (
    <div
      className="fixed inset-0 z-40"
      role="dialog"
      aria-modal
      aria-labelledby="client-title"
    >
      <DrawerEscape href={closeHref} />
      <Link
        href={closeHref}
        scroll={false}
        className="absolute inset-0 bg-black/20"
        aria-label="Cerrar"
      />
      <aside className="bg-surface absolute inset-y-0 right-0 flex w-full max-w-xl flex-col shadow-2xl">
        <header className="border-border flex items-start justify-between gap-3 border-b p-5">
          <div>
            <h2 id="client-title" className="text-lg font-semibold">
              {client.name}
            </h2>
            <div className="mt-1">
              <ClosedBadge closed={client.closed} />
            </div>
          </div>
          <Link
            href={closeHref}
            scroll={false}
            className="text-muted hover:text-foreground rounded-lg p-1"
            aria-label="Cerrar detalle"
          >
            <X className="size-5" />
          </Link>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <dl className="text-muted grid grid-cols-2 gap-3 text-sm">
            <Info icon={Mail} label="Email" value={client.email} />
            <Info icon={Phone} label="Teléfono" value={client.phone} />
            <Info icon={UserRound} label="Vendedor" value={client.seller} />
            <Info
              icon={Calendar}
              label="Reunión"
              value={formatDate(client.meetingDate)}
            />
          </dl>

          <section>
            <h3 className="text-subtle mb-2 text-xs font-medium tracking-wide uppercase">
              Transcripción
            </h3>
            <blockquote className="border-brand/40 bg-background rounded-r-lg border-l-2 p-4 text-sm leading-relaxed">
              {client.transcript}
            </blockquote>
          </section>

          <section>
            <h3 className="text-subtle mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
              <Bot className="text-brand size-3.5" aria-hidden /> Categorización
              del LLM
            </h3>
            {c ? (
              <div className="space-y-3">
                {c.summary && (
                  <p className="text-sm font-medium">{c.summary}</p>
                )}
                <dl className="divide-border divide-y text-sm">
                  <Row
                    label="Consultas / mes"
                    value={formatNumber(c.monthlyInquiries)}
                  />
                  {meta.dimensions.map((d) => {
                    const raw = c[d.key];
                    const values = Array.isArray(raw) ? raw : [raw];
                    const labels = values.map(
                      (v) => d.options.find((o) => o.value === v)?.label ?? v,
                    );
                    return (
                      <Row
                        key={d.key}
                        label={d.label}
                        value={
                          labels.length ? (
                            <span className="flex flex-wrap justify-end gap-1">
                              {labels.map((l) => (
                                <Badge key={l} tone="brand">
                                  {l}
                                </Badge>
                              ))}
                            </span>
                          ) : (
                            <span className="text-subtle">Ninguno</span>
                          )
                        }
                      />
                    );
                  })}
                </dl>
              </div>
            ) : (
              <p className="text-muted text-sm">
                Este cliente aún no fue categorizado. Corre{' '}
                <code>npm run categorize</code> en el backend para procesarlo.
              </p>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-subtle flex items-center gap-1 text-xs">
        <Icon className="size-3" aria-hidden />
        {label}
      </dt>
      <dd className="text-foreground truncate">{value}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="text-muted shrink-0">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
