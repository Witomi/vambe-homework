'use client';

import clsx from 'clsx';
import { LayoutDashboard, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { filterQuery } from '@/lib/filters/params';

const NAV = [
  { href: '/', label: 'Panel', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Al cambiar de vista se conservan los filtros activos.
  const query = filterQuery(Object.fromEntries(searchParams)).toString();

  return (
    <aside className="border-border bg-surface flex shrink-0 items-center gap-6 border-b px-4 py-3 md:sticky md:top-0 md:h-screen md:w-56 md:flex-col md:items-stretch md:border-r md:border-b-0 md:px-4 md:py-6">
      <Link href="/" className="flex items-center gap-2 md:px-2">
        <span className="bg-brand grid size-8 place-items-center rounded-lg text-white">
          <Sparkles className="size-4" aria-hidden />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-semibold">Vambe</span>
          <span className="text-subtle block text-xs">
            Insights comerciales
          </span>
        </span>
      </Link>

      <nav className="flex gap-1 md:mt-4 md:flex-col" aria-label="Principal">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={query ? `${href}?${query}` : href}
              aria-current={active ? 'page' : undefined}
              className={clsx(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-soft text-brand-strong'
                  : 'text-muted hover:bg-background hover:text-foreground',
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
