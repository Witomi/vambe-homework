/** Minúsculas y sin tildes, para búsquedas tolerantes ("clinica" = "Clínica"). */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}
