import {
  Categories,
  MULTI_DIMENSION_KEYS,
  MultiDimensionKey,
  SINGLE_DIMENSION_KEYS,
  SingleDimensionKey,
  isDerived,
  optionValues,
} from '../../domain/categories';
import { applyDerivedRules } from '../../domain/derived-rules';
import { normalizeText } from '../../utils/text';

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
    allowed.find((value) => value === 'otro' || value === 'no_especificado');
  if (fallback) return fallback;

  throw new LlmResponseParseError(
    `Valor inválido para "${key}": ${JSON.stringify(raw)}`,
  );
}

function resolveMulti(key: MultiDimensionKey, raw: unknown): string[] {
  if (raw === null || raw === undefined) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  const allowed = optionValues(key);
  const tokens = list
    .map(normalizeToken)
    .filter((token) => allowed.includes(token));
  return [...new Set(tokens)];
}

function resolveInquiries(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw !== 'number' && typeof raw !== 'string') return null;
  // En español "1.500" son mil quinientos: se descartan separadores.
  const amount = typeof raw === 'number' ? raw : Number(raw.replace(/\D/g, ''));
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : null;
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
    } catch (error) {
      throw new LlmResponseParseError(
        `JSON malformado: ${(error as Error).message}`,
      );
    }
  }
}

export function parseItem(raw: unknown): ParsedItem {
  if (typeof raw !== 'object' || raw === null) {
    throw new LlmResponseParseError('Elemento no es un objeto');
  }
  const fields = raw as Record<string, unknown>;
  const ref = Number(fields.ref);
  if (!Number.isInteger(ref)) {
    throw new LlmResponseParseError('Elemento sin "ref" válido');
  }

  const categories: Record<string, unknown> = {};
  for (const key of SINGLE_DIMENSION_KEYS) {
    if (!isDerived(key)) categories[key] = resolveSingle(key, fields[key]);
  }
  for (const key of MULTI_DIMENSION_KEYS) {
    categories[key] = resolveMulti(key, fields[key]);
  }
  categories.monthlyInquiries = resolveInquiries(fields.monthlyInquiries);
  categories.peakMonthlyInquiries = resolveInquiries(
    fields.peakMonthlyInquiries,
  );
  categories.summary =
    typeof fields.summary === 'string'
      ? fields.summary.trim().slice(0, 200)
      : '';

  return {
    ref,
    categories: applyDerivedRules(categories as Omit<Categories, 'complexity'>),
  };
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
