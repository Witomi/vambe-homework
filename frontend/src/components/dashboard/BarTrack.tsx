import clsx from 'clsx';

interface BarTrackProps {
  /** Largo de la barra, de 0 a 1. */
  width: number;
  colorClass: string;
  /** Posición (0 a 1) de la línea punteada de referencia, o null. */
  markerAt: number | null;
}

/** Pista de una barra horizontal con una línea punteada de referencia opcional. */
export function BarTrack({ width, colorClass, markerAt }: BarTrackProps) {
  return (
    <span className="relative h-5">
      <span
        className={clsx(
          'absolute inset-y-0.5 left-0 rounded-r-[4px]',
          colorClass,
        )}
        style={{ width: `${Math.max(width * 100, 1)}%` }}
      />
      {markerAt !== null && (
        <span
          className="border-foreground/50 absolute -inset-y-0.5 border-l border-dashed"
          style={{ left: `${markerAt * 100}%` }}
          aria-hidden
        />
      )}
    </span>
  );
}
