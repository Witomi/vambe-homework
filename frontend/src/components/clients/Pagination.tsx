import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { ClientsPage } from '@/lib/api/types';
import type { SearchParams } from '@/lib/filters/params';
import { hrefWith } from '@/lib/filters/url';
import { formatNumber } from '@/lib/format';

interface PaginationProps {
  page: Pick<ClientsPage, 'page' | 'pageSize' | 'total' | 'totalPages'>;
  params: SearchParams;
}

export function Pagination({ page, params }: PaginationProps) {
  const from = page.total ? (page.page - 1) * page.pageSize + 1 : 0;
  const to = Math.min(page.page * page.pageSize, page.total);
  const linkProps = { totalPages: page.totalPages, params };

  return (
    <div className="border-border text-muted flex items-center justify-between gap-3 border-t px-4 py-3 text-xs">
      <span>
        {formatNumber(from)}–{formatNumber(to)} de{' '}
        <strong className="text-foreground">{formatNumber(page.total)}</strong>{' '}
        clientes
      </span>
      <div className="flex items-center gap-2">
        <span>
          Página {page.page} de {page.totalPages}
        </span>
        <PageLink target={page.page - 1} label="Página anterior" {...linkProps}>
          <ChevronLeft className="size-4" />
        </PageLink>
        <PageLink
          target={page.page + 1}
          label="Página siguiente"
          {...linkProps}
        >
          <ChevronRight className="size-4" />
        </PageLink>
      </div>
    </div>
  );
}

interface PageLinkProps {
  target: number;
  totalPages: number;
  params: SearchParams;
  label: string;
  children: React.ReactNode;
}

/** Enlace a otra página; deshabilitado si queda fuera de rango. */
function PageLink({
  target,
  totalPages,
  params,
  label,
  children,
}: PageLinkProps) {
  const disabled = target < 1 || target > totalPages;
  return (
    <Link
      href={hrefWith('/clientes', params, {
        page: target === 1 ? null : target,
      })}
      scroll={false}
      aria-label={label}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : undefined}
      className={clsx(
        'border-border grid size-8 place-items-center rounded-lg border',
        disabled ? 'pointer-events-none opacity-40' : 'hover:bg-background',
      )}
    >
      {children}
    </Link>
  );
}
