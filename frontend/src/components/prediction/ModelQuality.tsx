import { Info } from 'lucide-react';
import type { Prediction } from '@/lib/api/types';
import { formatNumber, formatPct } from '@/lib/format';

/**
 * Qué tan bueno es el modelo, explicado sin jerga. Se muestra antes del
 * gráfico para que nadie lea las probabilidades como certezas.
 */
export function ModelQuality({ quality }: { quality: Prediction['quality'] }) {
  const errorReduction =
    (quality.baselineLogLoss - quality.logLoss) / quality.baselineLogLoss;

  const items = [
    {
      label: 'Acierta el orden',
      value: formatPct(quality.auc),
      detail: `Entre un cliente que cerró y uno que no, le da más probabilidad al que cerró el ${formatPct(quality.auc)} de las veces. Al azar sería 50%.`,
    },
    {
      label: 'Mejora sobre no usar modelo',
      value: `${(errorReduction * 100).toFixed(1).replace('.', ',')}%`,
      detail: `Menos error que asignarle a todos el promedio (${formatPct(quality.baseRate)}).`,
    },
    {
      label: 'Evaluado sin trampa',
      value: `${quality.folds} partes`,
      detail: `Validación cruzada sobre ${formatNumber(quality.sampleSize)} reuniones: cada cliente se evalúa con un modelo que no lo vio al entrenar.`,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="border-border bg-surface rounded-xl border p-4"
          >
            <p className="text-muted text-sm">{item.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {item.value}
            </p>
            <p className="text-subtle mt-1 text-xs leading-relaxed">
              {item.detail}
            </p>
          </div>
        ))}
      </div>
      <p className="border-border bg-surface text-muted flex items-start gap-2 rounded-xl border px-4 py-3 text-sm">
        <Info className="text-brand mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          <strong className="text-foreground font-medium">
            Señal real, pero débil.
          </strong>{' '}
          Lo que el cliente cuenta en la reunión explica solo una parte de si
          compra: el resto depende de cosas que no están en la transcripción
          (precio, momento, la negociación). Sirve para{' '}
          <strong className="text-foreground font-medium">priorizar</strong> a
          quién llamar, no para asegurar un cierre.
        </span>
      </p>
    </div>
  );
}
