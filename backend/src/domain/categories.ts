/**
 * Taxonomía de categorización: fuente única de verdad.
 *
 * Desde aquí se derivan el prompt del LLM, la validación de su respuesta,
 * los filtros de la API y las etiquetas que muestra el frontend.
 * Agregar un valor a una dimensión basta para que se propague a todo el sistema.
 */

export interface DimensionOption {
  value: string;
  label: string;
}

export interface DimensionDefinition {
  key: string;
  label: string;
  description: string;
  multi: boolean;
  /** Instrucción para el LLM sobre cómo elegir el valor. */
  hint: string;
  options: readonly DimensionOption[];
}

const opt = (value: string, label: string): DimensionOption => ({
  value,
  label,
});

export const DIMENSIONS = {
  industry: {
    key: 'industry',
    label: 'Industria',
    description: 'Rubro principal del negocio del cliente.',
    multi: false,
    hint: 'rubro del negocio',
    options: [
      opt('retail', 'Retail / Tiendas'),
      opt('ecommerce', 'E-commerce'),
      opt('salud', 'Salud / Clínicas'),
      opt('bienestar', 'Belleza / Bienestar / Deporte'),
      opt('gastronomia', 'Gastronomía'),
      opt('turismo', 'Turismo / Hotelería'),
      opt('educacion', 'Educación'),
      opt('finanzas_seguros', 'Finanzas / Seguros'),
      opt('inmobiliaria', 'Inmobiliaria / Construcción'),
      opt('logistica', 'Logística / Transporte'),
      opt('tecnologia', 'Tecnología / Software'),
      opt('servicios_profesionales', 'Servicios profesionales'),
      opt('eventos_entretenimiento', 'Eventos / Entretenimiento'),
      opt('ong_publico', 'ONG / Sector público'),
      opt('otro', 'Otro'),
    ],
  },
  businessSize: {
    key: 'businessSize',
    label: 'Tamaño',
    description:
      'Escala estimada del negocio (sucursales, equipo, alcance geográfico).',
    multi: false,
    hint: 'micro=independiente o emprendimiento, pequena=1 local/equipo chico, mediana=varias sedes o equipo mediano, grande=cadena/multi-ciudad/multi-país',
    options: [
      opt('micro', 'Micro'),
      opt('pequena', 'Pequeña'),
      opt('mediana', 'Mediana'),
      opt('grande', 'Grande'),
    ],
  },
  leadSource: {
    key: 'leadSource',
    label: 'Canal de adquisición',
    description: 'Cómo conoció el cliente a Vambe.',
    multi: false,
    hint: 'cómo conoció Vambe',
    options: [
      opt('referido', 'Recomendación / Referido'),
      opt('linkedin', 'LinkedIn'),
      opt('google', 'Google / Búsqueda'),
      opt('redes_sociales', 'Redes sociales (IG, FB, TikTok)'),
      opt('evento', 'Evento / Conferencia / Feria'),
      opt('contenido', 'Contenido (podcast, artículo, webinar)'),
      opt('comunidad', 'Foro / Comunidad'),
      opt('otro', 'Otro'),
    ],
  },
  inquiryChannel: {
    key: 'inquiryChannel',
    label: 'Canal de consultas',
    description: 'Por dónde le llegan hoy las consultas al cliente.',
    multi: false,
    hint: 'canal por donde reciben hoy las consultas; multicanal si menciona 2 o más',
    options: [
      opt('whatsapp', 'WhatsApp'),
      opt('telefono', 'Teléfono'),
      opt('email', 'Email'),
      opt('redes_sociales', 'Redes sociales'),
      opt('web', 'Sitio web / Chat'),
      opt('multicanal', 'Multicanal'),
      opt('no_especificado', 'No especificado'),
    ],
  },
  painPoint: {
    key: 'painPoint',
    label: 'Dolor principal',
    description: 'El problema de fondo que motiva la búsqueda de Vambe.',
    multi: false,
    hint: 'problema de fondo principal',
    options: [
      opt('volumen_alto', 'Volumen inmanejable'),
      opt('consultas_repetitivas', 'Consultas repetitivas'),
      opt('fuera_de_horario', 'Atención fuera de horario'),
      opt('tiempo_respuesta', 'Lentitud de respuesta'),
      opt('perdida_ventas', 'Pérdida de ventas / leads'),
      opt('crecimiento', 'Escalar por crecimiento'),
      opt('experiencia_cliente', 'Mejorar experiencia'),
      opt('otro', 'Otro'),
    ],
  },
  useCases: {
    key: 'useCases',
    label: 'Casos de uso',
    description: 'Funciones que el cliente espera del asistente.',
    multi: true,
    hint: 'todas las funciones que pide al chatbot',
    options: [
      opt('faq', 'Preguntas frecuentes'),
      opt('catalogo', 'Catálogo / Info de productos'),
      opt('agendamiento', 'Agendamiento de citas'),
      opt('reservas', 'Reservas'),
      opt('pedidos', 'Pedidos / Seguimiento'),
      opt('cotizaciones', 'Cotizaciones / Ventas'),
      opt('calificacion_leads', 'Calificación de leads'),
      opt('soporte', 'Soporte / Postventa'),
      opt('pagos', 'Pagos / Cobranza'),
      opt('recordatorios', 'Recordatorios'),
    ],
  },
  integrations: {
    key: 'integrations',
    label: 'Integraciones',
    description: 'Sistemas con los que el cliente necesita conectar Vambe.',
    multi: true,
    hint: 'sistemas externos a integrar; lista vacía si no menciona ninguno',
    options: [
      opt('crm', 'CRM'),
      opt('erp', 'ERP'),
      opt('agenda', 'Agenda / Turnos'),
      opt('pos', 'POS / Caja'),
      opt('ecommerce', 'Plataforma e-commerce'),
      opt('reservas', 'Sistema de reservas / PMS'),
      opt('pagos', 'Pasarela de pagos'),
      opt('inventario', 'Inventario / Stock'),
      opt('otro', 'Otro sistema'),
    ],
  },
  requirements: {
    key: 'requirements',
    label: 'Requisitos clave',
    description: 'Exigencias no funcionales que plantea el cliente.',
    multi: true,
    hint: 'exigencias explícitas; lista vacía si no hay',
    options: [
      opt('disponibilidad_24_7', 'Disponibilidad 24/7'),
      opt('multicanal', 'Multicanal'),
      opt('multiidioma', 'Multiidioma'),
      opt('derivacion_humano', 'Derivación a humano'),
      opt('tono_marca', 'Tono de marca / Empatía'),
      opt('datos_sensibles', 'Seguridad / Datos sensibles'),
      opt('personalizacion', 'Personalización'),
    ],
  },
  objections: {
    key: 'objections',
    label: 'Objeciones',
    description: 'Dudas o frenos que expresa el cliente durante la reunión.',
    multi: true,
    hint: 'dudas o frenos explícitos; lista vacía si no hay',
    options: [
      opt('precio', 'Precio / Presupuesto'),
      opt('comparando', 'Comparando alternativas'),
      opt('implementacion', 'Complejidad de implementación'),
      opt('seguridad', 'Seguridad / Privacidad'),
      opt('calidad_ia', 'Desconfianza en la IA'),
      opt('timing', 'No es el momento'),
    ],
  },
  urgency: {
    key: 'urgency',
    label: 'Urgencia',
    description: 'Qué tan apremiante es la necesidad según el discurso.',
    multi: false,
    hint: 'alta si dice insostenible/urgente/inmediato, baja si está explorando',
    options: [opt('alta', 'Alta'), opt('media', 'Media'), opt('baja', 'Baja')],
  },
  complexity: {
    key: 'complexity',
    label: 'Complejidad técnica',
    description:
      'Esfuerzo de implementación estimado (integraciones, idiomas, reglas de negocio).',
    multi: false,
    hint: 'baja=FAQ simple, media=1 integración o flujos, alta=varias integraciones/idiomas/datos sensibles',
    options: [opt('baja', 'Baja'), opt('media', 'Media'), opt('alta', 'Alta')],
  },
} as const satisfies Record<string, DimensionDefinition>;

export type DimensionKey = keyof typeof DIMENSIONS;

type OptionValue<K extends DimensionKey> =
  (typeof DIMENSIONS)[K]['options'][number]['value'];

export type SingleDimensionKey = {
  [K in DimensionKey]: (typeof DIMENSIONS)[K]['multi'] extends false
    ? K
    : never;
}[DimensionKey];

export type MultiDimensionKey = Exclude<DimensionKey, SingleDimensionKey>;

/** Resultado de categorizar una transcripción. */
export type Categories = {
  [K in SingleDimensionKey]: OptionValue<K>;
} & {
  [K in MultiDimensionKey]: OptionValue<K>[];
} & {
  /** Consultas mensuales normalizadas (diarias × 30, semanales × 4,3). */
  monthlyInquiries: number | null;
  /** Resumen de una línea de la necesidad del cliente. */
  summary: string;
};

export const DIMENSION_KEYS = Object.keys(DIMENSIONS) as DimensionKey[];

export const SINGLE_DIMENSION_KEYS = DIMENSION_KEYS.filter(
  (k) => !DIMENSIONS[k].multi,
) as SingleDimensionKey[];

export const MULTI_DIMENSION_KEYS = DIMENSION_KEYS.filter(
  (k) => DIMENSIONS[k].multi,
) as MultiDimensionKey[];

/** Etiqueta legible de un valor: ('industry', 'salud') → "Salud / Clínicas". */
export function optionLabel(key: DimensionKey, value: string): string {
  return DIMENSIONS[key].options.find((o) => o.value === value)?.label ?? value;
}

export function optionValues(key: DimensionKey): string[] {
  return DIMENSIONS[key].options.map((o) => o.value);
}

/**
 * Valor sintético para dimensiones de lista: el cliente no mencionó nada
 * (p. ej. ninguna integración). No es una opción para el LLM —una lista
 * vacía ya lo expresa—, pero sí se muestra en métricas y filtros para que
 * los porcentajes cuenten a todos los clientes.
 */
export const NOT_MENTIONED: DimensionOption = {
  value: 'no_menciona',
  label: 'No lo menciona',
};

/** Opciones visibles para filtrar y mostrar: las del LLM + "No lo menciona" en listas. */
export function displayOptions(key: DimensionKey): DimensionOption[] {
  const options = [...DIMENSIONS[key].options];
  return DIMENSIONS[key].multi ? [...options, NOT_MENTIONED] : options;
}

/**
 * Valores comodín que no sirven para decidir nada: un hallazgo sobre
 * "Otro" o "No lo menciona" no es accionable.
 */
const NON_ACTIONABLE_VALUES = new Set([
  'otro',
  'no_especificado',
  NOT_MENTIONED.value,
]);

export function isActionable(value: string): boolean {
  return !NON_ACTIONABLE_VALUES.has(value);
}

/** Valores aceptados como filtro de una dimensión. */
export function filterValues(key: DimensionKey): string[] {
  return displayOptions(key).map((o) => o.value);
}

/** Rangos de volumen mensual de consultas, usados para segmentar. */
export const VOLUME_BUCKETS = [
  { value: 'bajo', label: '< 200 / mes', max: 200 },
  { value: 'medio', label: '200 – 1.000 / mes', max: 1000 },
  { value: 'alto', label: '1.000 – 5.000 / mes', max: 5000 },
  { value: 'muy_alto', label: '> 5.000 / mes', max: Infinity },
] as const;

export type VolumeBucket = (typeof VOLUME_BUCKETS)[number]['value'];

export function volumeBucket(monthly: number | null): VolumeBucket | null {
  if (monthly === null) return null;
  return VOLUME_BUCKETS.find((b) => monthly < b.max)!.value;
}
