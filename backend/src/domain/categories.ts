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
  /**
   * Reglas detalladas para el LLM (y para quien etiqueta los evals):
   * cuándo corresponde cada valor, en orden de prioridad si aplica.
   */
  criteria?: readonly string[];
  /**
   * Se calcula en código a partir de otras dimensiones (no la responde el
   * LLM), para que la regla se aplique siempre igual.
   */
  derived?: boolean;
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
    criteria: [
      'retail = tienda física de productos; ecommerce = vende principalmente online.',
      'salud incluye farmacias y veterinarias; gastronomia incluye catering y elaboración de alimentos; educacion incluye academias y capacitación corporativa.',
      'servicios_profesionales = consultoría, abogados, contadores, agencias.',
      'otro = manufactura, talleres, oficios u otros rubros no listados.',
    ],
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
    hint: 'tamaño del negocio que habla, no el de sus clientes',
    criteria: [
      'Usa la PRIMERA regla que aplique:',
      '1. Cantidad de locales, sedes, sucursales, oficinas o ciudades donde opera: 1 → pequena; 2 a 4 → mediana; 5 o más → grande (6 locales → grande).',
      '2. Cantidad de empleados o profesionales: 1 a 2 → micro; 3 a 10 → pequena; 11 a 100 → mediana; más de 100 → grande.',
      '3. Se describe como cadena, o con operación propia en todo el país o en varios países → grande.',
      '4. Se describe como emprendimiento o negocio de una sola persona → micro ("independiente" significa que no es de una cadena, no que sea micro); como "pequeño/a" → pequena; como "mediano/a" → mediana.',
      '5. Sin ninguna de esas pistas → no_especificado. NO lo deduzcas del rubro, del volumen de consultas, de la cantidad de clientes, pacientes, estudiantes o pedidos, ni de dónde vienen sus clientes (vender online a varios países o atender pacientes de todo el país no es tener presencia ahí).',
    ],
    options: [
      opt('micro', 'Micro'),
      opt('pequena', 'Pequeña'),
      opt('mediana', 'Mediana'),
      opt('grande', 'Grande'),
      opt('no_especificado', 'No especificado'),
    ],
  },
  leadSource: {
    key: 'leadSource',
    label: 'Canal de adquisición',
    description: 'Cómo conoció el cliente a Vambe.',
    multi: false,
    hint: 'cómo conoció Vambe',
    criteria: [
      'Elige según DÓNDE lo vio, en este orden:',
      '1. En una plataforma (LinkedIn, Google, Instagram, Facebook, TikTok) → esa plataforma, aunque haya llegado por un contacto o por un artículo publicado ahí ("un artículo en LinkedIn" → linkedin).',
      '2. En un podcast, artículo, blog, revista, webinar, video o newsletter → contenido (un webinar es contenido, no evento), aunque se lo haya pasado alguien.',
      '3. En un foro, grupo o comunidad → comunidad.',
      '4. Se lo recomendó una persona (colega, contacto, conocido) → referido, aunque haya sido en un evento.',
      '5. En una conferencia, feria o evento presencial, sin recomendación de una persona → evento.',
    ],
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
    hint: 'canal por donde reciben hoy las consultas',
    criteria: [
      'llamadas → telefono; Instagram, Facebook o redes → redes_sociales; chat del sitio → web.',
      'multicanal si menciona 2 o más canales o dice que llegan por varias plataformas o canales (p. ej. "entre plataformas").',
      'no_especificado si no dice por dónde llegan.',
    ],
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
    criteria: [
      'Usa la PRIMERA regla que aplique:',
      '1. perdida_ventas: dice que pierde clientes, ventas, citas, reservas o leads.',
      '2. crecimiento: atribuye la necesidad a que está creciendo o expandiéndose ("creció mucho", "expansión", "con nuestro crecimiento"), aunque también mencione mucho volumen.',
      '3. volumen_alto: dice que el volumen lo satura, lo supera o le quita demasiado tiempo al equipo, o recibe más de 5.000 consultas al mes (unas 170 al día).',
      '4. fuera_de_horario: dice que sus clientes escriben o llaman a toda hora o fuera de horario (pedir 24/7 como requisito no basta: eso va en requirements).',
      '5. tiempo_respuesta: se queja de que responden lento.',
      '6. experiencia_cliente: dice que busca mejorar la atención o la experiencia ("para mejorar atención"), o que se diferencia por cómo atiende o por lo que vende (artesanal, personal, exclusivo).',
      '7. consultas_repetitivas: describe consultas recurrentes que quiere automatizar, sin ninguno de los problemas anteriores (es el caso más común).',
      '8. otro: ninguna aplica.',
    ],
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
    criteria: [
      'faq: responder preguntas generales (horarios, precios, requisitos, políticas, seguros, ubicación, procesos, cómo funciona un servicio) o presentar los servicios del negocio. Inclúyelo siempre que mencione consultas o preguntas generales que recibe o que el bot debe responder.',
      'catalogo: mostrar, describir, buscar o recomendar productos físicos a la venta, propiedades, espacios o salones para arrendar, destinos o tours, o consultar su stock o disponibilidad. Presentar servicios, cursos, programas, tratamientos, paquetes, portafolio, casos de éxito, menús o especificaciones técnicas NO es catalogo: es faq.',
      'agendamiento: agendar, reprogramar o cancelar citas, visitas, sesiones, clases o evaluaciones.',
      'reservas: reservar mesas, habitaciones, tours o cupos. Una cita médica o una sesión es agendamiento, no reserva.',
      'pedidos: tomar pedidos o compras, reservar o apartar productos, confirmar órdenes, o informar el estado de un pedido, envío (tracking) o trabajo en curso. Preguntas generales sobre envíos o entregas son faq.',
      'cotizaciones: cotizar, dar presupuestos o vender (incluye inscripciones, matrículas, admisiones y contratar un plan).',
      'calificacion_leads: pide evaluar, diagnosticar o pre-calificar prospectos, capturar sus datos para seguimiento comercial, o pasar a los clientes interesados al equipo de ventas o de cuentas. Derivar casos a especialistas o profesionales (médicos, técnicos, dentistas) NO es calificar: es derivacion_humano. Responder, cotizar o priorizar urgencias tampoco es calificar.',
      'soporte: soporte técnico, reclamos, devoluciones, cambios, garantías, trámites o seguimiento posterior a la compra o al servicio.',
      'pagos: procesar pagos, depósitos o abonos, validar pagos o cobranza (preguntar por formas de pago es faq).',
      'recordatorios: enviar recordatorios o confirmaciones automáticas (p. ej. confirmar asistencia).',
    ],
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
    criteria: [
      'Solo sistemas que menciona explícitamente. No agregues ecommerce por vender online ni agenda por agendar citas si no nombra un sistema.',
      'agenda = sistema de citas o turnos; inventario = inventario o stock; reservas = sistema o plataforma de reservas o de mesas (p. ej. TheFork).',
      'crm o erp solo si los nombra; cualquier otro sistema propio (de taller, tracking, escolar, RRHH, MLS, base de datos) → otro.',
    ],
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
    hint: 'exigencias explícitas sobre el chatbot; lista vacía si no hay',
    criteria: [
      'disponibilidad_24_7: pide que el bot atienda 24/7, fuera de horario o en horario extendido. Informar que el negocio tiene un servicio de 24 horas no es este requisito.',
      'multicanal: pide atender o centralizar varios canales.',
      'multiidioma: pide atender en más de un idioma.',
      'derivacion_humano: pide derivar, escalar o pasar casos a una persona, especialista o equipo (frases como "derive a", "escale a", "derivar casos", "pasar a un asesor"), aunque sea solo para algunos casos.',
      'tono_marca: pide un tono, estilo o personalidad (empático, amigable, profesional, lúdico, ejecutivo, transmitir emoción o la historia de la marca).',
      'datos_sensibles: menciona privacidad, confidencialidad o datos médicos, financieros o personales.',
      'personalizacion: pide adaptar respuestas o recomendaciones a cada cliente (preferencias, historial, ubicación). Personalizar el tono es tono_marca.',
    ],
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
    hint: 'urgencia por implementar Vambe',
    criteria: [
      'alta: dice que el volumen es insostenible, que lo satura ("nos saturan"), que pierde clientes o ventas, o que lo necesita ya.',
      'baja: está explorando, evaluando o comparando opciones sin apuro.',
      'media: en cualquier otro caso.',
      'Es la urgencia del negocio por contratar, NO urgencias médicas ni emergencias de sus clientes. Una cifra alta de consultas (aunque supere las 5.000 al mes) NO hace alta la urgencia si no dice que eso lo supera.',
    ],
    options: [opt('alta', 'Alta'), opt('media', 'Media'), opt('baja', 'Baja')],
  },
  complexity: {
    key: 'complexity',
    label: 'Complejidad técnica',
    description:
      'Esfuerzo de implementación estimado (integraciones, idiomas, reglas de negocio).',
    multi: false,
    hint: 'alta = 2 o más integraciones, varios idiomas o datos sensibles; media = 1 integración o algún flujo transaccional; baja = solo informar',
    derived: true,
    options: [opt('baja', 'Baja'), opt('media', 'Media'), opt('alta', 'Alta')],
  },
  seasonality: {
    key: 'seasonality',
    label: 'Estacionalidad',
    description:
      'Si el cliente menciona períodos con más consultas (temporada alta, fechas especiales, campañas, fines de semana).',
    multi: false,
    hint: 'con_peaks si menciona temporada alta, picos, fechas especiales, campañas o días con más demanda; sin_peaks si no',
    options: [
      opt('con_peaks', 'Con peaks / temporada'),
      opt('sin_peaks', 'Sin peaks mencionados'),
    ],
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
  /** Consultas al mes en los peaks, si el cliente da esa cifra. */
  peakMonthlyInquiries: number | null;
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
