'use client';

import clsx from 'clsx';
import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';

type Status = 'idle' | 'copied' | 'failed';

/** Cuánto se muestra la confirmación después de copiar. */
const FEEDBACK_MS = 1500;

/**
 * Texto que se copia al portapapeles con un clic. Muestra un ícono al pasar
 * el mouse y confirma con "Copiado" (o avisa si el navegador no lo permitió).
 */
export function CopyText({
  value,
  label,
  children,
  className,
}: {
  /** Lo que se copia (puede diferir de lo que se muestra). */
  value: string;
  /** Qué es, para el tooltip y lectores de pantalla: "email", "teléfono". */
  label: string;
  /** Lo que se muestra; por defecto, `value`. */
  children?: React.ReactNode;
  className?: string;
}) {
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    if (status === 'idle') return;
    const timer = setTimeout(() => setStatus('idle'), FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [status]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title={`Copiar ${label}`}
      aria-label={`Copiar ${label}: ${value}`}
      className={clsx(
        'group/copy hover:text-brand inline-flex max-w-full items-center gap-1 text-left',
        className,
      )}
    >
      <span className="truncate">{children ?? value}</span>
      {status === 'idle' ? (
        <Copy
          className="size-3 shrink-0 opacity-0 transition-opacity group-hover/copy:opacity-100"
          aria-hidden
        />
      ) : (
        <span
          role="status"
          className={clsx(
            'flex shrink-0 items-center gap-0.5 text-[11px] font-medium',
            status === 'copied' ? 'text-brand-strong' : 'text-negative-strong',
          )}
        >
          {status === 'copied' && <Check className="size-3" aria-hidden />}
          {status === 'copied' ? 'Copiado' : 'No se pudo copiar'}
        </span>
      )}
    </button>
  );
}
