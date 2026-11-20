import { createHash } from 'node:crypto';
import { parse } from 'csv-parse/sync';
import { RawClient } from '../domain/client';

/** Columnas del CSV de origen. */
const COLUMNS = {
  name: 'Nombre',
  email: 'Correo Electronico',
  phone: 'Numero de Telefono',
  meetingDate: 'Fecha de la Reunion',
  seller: 'Vendedor asignado',
  closed: 'closed',
  transcript: 'Transcripcion',
} as const;

/**
 * ID estable derivado del contenido: no depende del orden de las filas,
 * así las categorizaciones guardadas sobreviven a reordenar el CSV.
 */
function clientId(row: Record<string, string>): string {
  return createHash('sha1')
    .update(
      [row[COLUMNS.email], row[COLUMNS.meetingDate], row[COLUMNS.name]].join(
        '|',
      ),
    )
    .digest('hex')
    .slice(0, 12);
}

export function parseClientsCsv(content: string): RawClient[] {
  const rows = parse<Record<string, string>>(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

  const missing = Object.values(COLUMNS).filter(
    (column) => rows.length > 0 && !(column in rows[0]),
  );
  if (missing.length) {
    throw new Error(`Faltan columnas en el CSV: ${missing.join(', ')}`);
  }

  return rows.map((row) => ({
    id: clientId(row),
    name: row[COLUMNS.name],
    email: row[COLUMNS.email],
    phone: row[COLUMNS.phone],
    seller: row[COLUMNS.seller],
    meetingDate: row[COLUMNS.meetingDate],
    closed: row[COLUMNS.closed] === '1',
    transcript: row[COLUMNS.transcript],
  }));
}
