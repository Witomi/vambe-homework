'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Cierra el panel de detalle con la tecla Escape. */
export function DrawerEscape({ href }: { href: string }) {
  const router = useRouter();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') router.replace(href, { scroll: false });
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [href, router]);
  return null;
}
