/**
 * Transformaciones de query params (siempre llegan como string) a tipos
 * útiles, usadas con `@Transform` en los DTOs.
 */

/** `?industry=salud,retail` y `?industry=salud&industry=retail` → `['salud','retail']` */
export const toList = ({ value }: { value: unknown }): string[] | undefined => {
  if (value === undefined || value === '') return undefined;
  const list = (Array.isArray(value) ? value : [value])
    .flatMap((value) => String(value).split(','))
    .map((value) => value.trim())
    .filter(Boolean);
  return list.length ? list : undefined;
};

/** `'true'`/`'false'` del query string → booleano; otros valores pasan intactos para que falle la validación. */
export const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};
