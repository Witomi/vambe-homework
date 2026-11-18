import clsx from 'clsx';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import type { SearchParams } from '@/lib/filters/params';
import { hrefWith } from '@/lib/filters/url';

interface SortableHeaderProps {
  field: string;
  /** Orden actual de la tabla. */
  sortBy: string;
  sortDir: string;
  params: SearchParams;
  className?: string;
  children: React.ReactNode;
}

/**
 * Encabezado de columna que alterna el orden vía URL:
 * primer clic descendente, segundo ascendente.
 */
export function SortableHeader({
  field,
  sortBy,
  sortDir,
  params,
  className,
  children,
}: SortableHeaderProps) {
  const active = sortBy === field;
  const nextDir = active && sortDir === 'desc' ? 'asc' : 'desc';
  const Icon = !active ? ArrowUpDown : sortDir === 'desc' ? ArrowDown : ArrowUp;
  const ariaSort = active
    ? sortDir === 'desc'
      ? 'descending'
      : 'ascending'
    : undefined;

  return (
    <th
      scope="col"
      className={clsx('px-4 py-2.5 font-medium', className)}
      aria-sort={ariaSort}
    >
      <Link
        href={hrefWith('/clientes', params, {
          sortBy: field,
          sortDir: nextDir,
          page: null,
        })}
        scroll={false}
        className={clsx(
          'inline-flex items-center gap-1',
          active ? 'text-foreground' : 'hover:text-foreground',
        )}
      >
        {children}
        <Icon className="size-3" aria-hidden />
      </Link>
    </th>
  );
}
