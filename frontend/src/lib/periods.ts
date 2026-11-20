/**
 * Períodos que se pueden revisar en las cifras clave del panel: un mes
 * (`YYYY-MM`) o todo el histórico. Viven en el parámetro `?period=` de la URL.
 */

export const HISTORIC_PERIOD = 'historico';

/** Meses entre dos fechas ISO, del más reciente al más antiguo. */
export function monthsBetween(from: string, to: string): string[] {
  const index = (iso: string) => {
    const [year, month] = iso.split('-').map(Number);
    return year * 12 + (month - 1);
  };
  const months: string[] = [];
  for (let i = index(to); i >= index(from); i--) {
    months.push(
      `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`,
    );
  }
  return months;
}
