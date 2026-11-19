import { Bot, Calendar, Mail, Phone, UserRound, X } from 'lucide-react';
import Link from 'next/link';
import type { ClientDetail, Meta } from '@/lib/api/types';
import type { SearchParams } from '@/lib/filters/params';
import { hrefWith } from '@/lib/filters/url';
import { formatDate, formatPct } from '@/lib/format';
import { ClosedBadge } from '../ui/Badge';
import { GradeBadge } from '../ui/GradeBadge';
import { ClientCategories } from './ClientCategories';
import { DrawerEscape } from './DrawerEscape';

interface ClientDrawerProps {
  client: ClientDetail;
  meta: Meta;
  params: SearchParams;
}

/**
 * Panel lateral con el detalle del cliente: la transcripción original junto
 * a su categorización, para verificar cómo la interpretó el LLM.
 * Se abre con `?cliente=<id>` y se cierra quitando ese parámetro.
 */
export function ClientDrawer({ client, meta, params }: ClientDrawerProps) {
  const closeHref = hrefWith('/clientes', params, { cliente: null });

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
            <ContactField icon={Mail} label="Email" value={client.email} />
            <ContactField icon={Phone} label="Teléfono" value={client.phone} />
            <ContactField
              icon={UserRound}
              label="Vendedor"
              value={client.seller}
            />
            <ContactField
              icon={Calendar}
              label="Reunión"
              value={formatDate(client.meetingDate)}
            />
          </dl>

          {client.prediction && (
            <section className="border-border flex items-center gap-3 rounded-lg border p-3">
              <GradeBadge
                grade={client.prediction.grade}
                probability={client.prediction.probability}
                size="md"
              />
              <div className="text-sm">
                <p className="font-medium">
                  {meta.grades.find((g) => g.value === client.prediction!.grade)
                    ?.label ?? `Nota ${client.prediction.grade}`}
                </p>
                <p className="text-muted text-xs">
                  Probabilidad de cierre estimada:{' '}
                  {formatPct(client.prediction.probability)}
                </p>
              </div>
            </section>
          )}

          <section>
            <SectionTitle>Transcripción</SectionTitle>
            <blockquote className="border-brand/40 bg-background rounded-r-lg border-l-2 p-4 text-sm leading-relaxed">
              {client.transcript}
            </blockquote>
          </section>

          <section>
            <SectionTitle>
              <Bot className="text-brand size-3.5" aria-hidden /> Categorización
              del LLM
            </SectionTitle>
            {client.categories ? (
              <ClientCategories
                categories={client.categories}
                dimensions={meta.dimensions}
              />
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-subtle mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
      {children}
    </h3>
  );
}

function ContactField({
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
