import {
  DIMENSIONS,
  DIMENSION_KEYS,
  DimensionDefinition,
} from '../../domain/categories';

export interface PromptItem {
  /** Identificador corto dentro del lote (1..n) para emparejar respuestas. */
  ref: number;
  transcript: string;
}

/** Dimensiones que responde el LLM (las derivadas se calculan en código). */
const PROMPT_DIMENSION_KEYS = DIMENSION_KEYS.filter(
  (key) => !('derived' in DIMENSIONS[key]),
);

function describeDimensions(): string {
  return PROMPT_DIMENSION_KEYS.map((key) => {
    const d: DimensionDefinition = DIMENSIONS[key];
    const values = d.options.map((o) => o.value).join(' | ');
    const shape = d.multi ? `lista de [${values}]` : values;
    const criteria = (d.criteria ?? []).map((c) => `\n    · ${c}`).join('');
    return `- "${key}" (${d.hint}): ${shape}${criteria}`;
  }).join('\n');
}

const DIMENSION_SPEC = describeDimensions();

/**
 * Construye un prompt que categoriza varias transcripciones a la vez.
 * Procesar en lotes reduce drásticamente las llamadas a la API (y el
 * impacto del rate limit), manteniendo la salida emparejada por `ref`.
 */
export function buildCategorizationPrompt(items: PromptItem[]): string {
  const input = items.map((i) => ({ ref: i.ref, texto: i.transcript }));

  return `Eres un analista de ventas de Vambe, una plataforma de chatbots con IA para atención al cliente.
Recibirás transcripciones de reuniones de venta donde un potencial cliente describe su negocio y necesidades.
Categoriza CADA transcripción según estas dimensiones, usando EXCLUSIVAMENTE los valores permitidos:

${DIMENSION_SPEC}
- "monthlyInquiries": número entero de consultas por MES (convierte: diarias×30, semanales×4; si da un rango usa el promedio)
- "peakMonthlyInquiries": número entero de consultas por MES durante los peaks (temporada alta, campañas, fechas especiales), con la misma conversión; null si no da una cifra para el peak
- "summary": resumen en español de máximo 15 palabras de lo que necesita el cliente

Reglas para "monthlyInquiries":
- Usa SOLO una cifra explícita de consultas, mensajes, llamadas o chats que recibe el negocio.
- NO la derives de pedidos, órdenes, reservas, entregas, estudiantes, pacientes, seguidores ni clientes ("200 órdenes semanales" → null).
- Si solo dice "miles", "muchas" o "constantemente", sin cifra, usa null. Nunca inventes una cifra.
- Usa el volumen NORMAL. No extrapoles cifras de picos, temporada alta, campañas, lanzamientos, fechas especiales ni cifras por hora: si además da una cifra normal, usa esa; si solo da la del pico, usa null ("200 consultas por semana durante el período de inscripción" → monthlyInquiries: null, peakMonthlyInquiries: 800).

Reglas para los peaks:
- "seasonality" es "con_peaks" si menciona períodos con más consultas (temporada alta, picos, fechas especiales, campañas, fines de semana), aunque no dé cifras.
- La cifra del peak va en "peakMonthlyInquiries", nunca en "monthlyInquiries". Ej.: "60 consultas diarias en temporada alta" → monthlyInquiries: null, peakMonthlyInquiries: 1800.

Reglas generales:
- Responde SOLO con un arreglo JSON válido, sin texto adicional ni bloques de código.
- Un objeto por transcripción, con el campo "ref" igual al de la entrada.
- Las dimensiones de tipo lista pueden ser [] si no aplica.
- Usa "otro" o "no_especificado" solo si ninguna opción encaja.
- Básate SOLO en lo que dice la transcripción; no supongas datos que no menciona.

Ejemplo de un elemento de salida:
{"ref":1,"industry":"salud","businessSize":"mediana","leadSource":"referido","inquiryChannel":"telefono","painPoint":"consultas_repetitivas","useCases":["agendamiento","faq"],"integrations":["agenda"],"requirements":["datos_sensibles"],"objections":[],"urgency":"media","seasonality":"sin_peaks","monthlyInquiries":400,"peakMonthlyInquiries":null,"summary":"Clínica dental que quiere automatizar agendamiento y confirmar citas"}

Transcripciones:
${JSON.stringify(input)}`;
}
