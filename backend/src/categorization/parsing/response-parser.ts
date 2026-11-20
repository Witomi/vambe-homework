import {
  Categories,
  DIMENSIONS,
  MULTI_DIMENSION_KEYS,
  SINGLE_DIMENSION_KEYS,
  SingleDimensionKey,
  optionValues,
} from '../../domain/categories';
import { deriveComplexity } from '../../domain/complexity';
import { normalizeText } from '../../common/text';

export class LlmResponseParseError extends Error {}

export interface ParsedItem {
  ref: number;
  categories: Categories;
}

/** Valor por defecto cuando el LLM entrega algo fuera de la taxonomía. */
const FALLBACKS: Partial<Record<SingleDimensionKey, string>> = {
  urgency: 'media',
  seasonality: 'sin_peaks',
};

/** "Servicios Profesionales" -> "servicios_profesionales" */
function normalizeToken(value: unknown): string {
  if (typeof value !== 'string') return '';
  return normalizeText(value)
    .trim()
    .replace(/[\s/-]+/g, '_');
}

function resolveSingle(key: SingleDimensionKey, raw: unknown): string {
  const allowed = optionValues(key);
  const token = normalizeToken(raw);
  if (allowed.includes(token)) return token;

  const fallback =
    FALLBACKS[key] ??
    allowed.find((v) => v === 'otro' || v === 'no_especificado');
  if (fallback) return fallback;

  throw new LlmResponseParseError(
    `Valor inválido para "${key}": ${JSON.stringify(raw)}`,
  );
}

function resolveMulti(key: string, raw: unknown): string[] {
  if (raw === null || raw === undefined) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  const allowed = optionValues(key as keyof typeof DIMENSIONS);
  const tokens = list.map(normalizeToken).filter((t) => allowed.includes(t));
  return [...new Set(tokens)];
}

function resolveInquiries(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw !== 'number' && typeof raw !== 'string') return null;
  // En español "1.500" son mil quinientos: se descartan separadores.
  const n = typeof raw === 'number' ? raw : Number(raw.replace(/\D/g, ''));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

/** Más consultas que esto al mes cuenta como volumen alto (≈170 al día). */
export const HIGH_VOLUME_MONTHLY = 5000;

/** Dolores con menor prioridad que "volumen alto" en los criterios. */
const BELOW_HIGH_VOLUME = [
  'fuera_de_horario',
  'tiempo_respuesta',
  'experiencia_cliente',
  'consultas_repetitivas',
  'otro',
];

/**
 * Aplica en código la regla de volumen de los criterios: el LLM no siempre
 * convierte "250 consultas diarias" a mensual antes de comparar.
 */
function applyVolumeRule(painPoint: string, monthly: number | null): string {
  const high = monthly !== null && monthly > HIGH_VOLUME_MONTHLY;
  return high && BELOW_HIGH_VOLUME.includes(painPoint)
    ? 'volumen_alto'
    : painPoint;
}

/**
 * Extrae el JSON de la respuesta del modelo. Los modelos abiertos a veces
 * agregan bloques ```json o texto alrededor, así que se busca el primer
 * arreglo/objeto válido en lugar de confiar en la respuesta cruda.
 */
export function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.search(/[[{]/);
    const end = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'));
    if (start === -1 || end <= start) {
      throw new LlmResponseParseError('La respuesta no contiene JSON');
    }
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch (e) {
      throw new LlmResponseParseError(
        `JSON malformado: ${(e as Error).message}`,
      );
    }
  }
}

export function parseItem(raw: unknown): ParsedItem {
  if (typeof raw !== 'object' || raw === null) {
    throw new LlmResponseParseError('Elemento no es un objeto');
  }
  const obj = raw as Record<string, unknown>;
  const ref = Number(obj.ref);
  if (!Number.isInteger(ref)) {
    throw new LlmResponseParseError('Elemento sin "ref" válido');
  }

  const categories: Record<string, unknown> = {};
  for (const key of SINGLE_DIMENSION_KEYS) {
    if ('derived' in DIMENSIONS[key]) continue;
    categories[key] = resolveSingle(key, obj[key]);
  }
  for (const key of MULTI_DIMENSION_KEYS) {
    categories[key] = resolveMulti(key, obj[key]);
  }
  categories.monthlyInquiries = resolveInquiries(obj.monthlyInquiries);
  categories.peakMonthlyInquiries = resolveInquiries(obj.peakMonthlyInquiries);
  categories.painPoint = applyVolumeRule(
    categories.painPoint as string,
    categories.monthlyInquiries as number | null,
  );
  categories.complexity = deriveComplexity(
    categories as Pick<
      Categories,
      'integrations' | 'requirements' | 'useCases'
    >,
  );
  categories.summary =
    typeof obj.summary === 'string' ? obj.summary.trim().slice(0, 200) : '';

  return { ref, categories: categories as Categories };
}

/**
 * Parsea la respuesta de un lote. Devuelve los elementos válidos; los
 * inválidos o ausentes quedan fuera para que el llamador los reintente.
 */
export function parseBatchResponse(text: string): ParsedItem[] {
  const json = extractJson(text);
  const list = Array.isArray(json) ? json : [json];
  const parsed: ParsedItem[] = [];
  for (const item of list) {
    try {
      parsed.push(parseItem(item));
    } catch {
      // Se omite: el servicio reintentará las transcripciones faltantes.
    }
  }
  return parsed;
}
