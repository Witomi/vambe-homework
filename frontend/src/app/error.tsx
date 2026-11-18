'use client';

import { ServerCrash } from 'lucide-react';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="border-border bg-surface mx-auto mt-16 max-w-md rounded-xl border p-8 text-center">
      <ServerCrash className="text-negative mx-auto size-8" aria-hidden />
      <h1 className="mt-3 text-lg font-semibold">
        No pudimos cargar los datos
      </h1>
      <p className="text-muted mt-1 text-sm">
        Verifica que el backend esté corriendo y que{' '}
        <code>NEXT_PUBLIC_API_URL</code> apunte a él.
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-brand hover:bg-brand-strong mt-5 rounded-lg px-4 py-2 text-sm font-medium text-white"
      >
        Reintentar
      </button>
    </div>
  );
}
