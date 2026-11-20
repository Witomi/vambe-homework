/**
 * Las dimensiones que se extraen de cada transcripción: valores permitidos,
 * etiquetas y criterios para elegir cada valor.
 *
 * Es la fuente única de verdad: desde aquí se derivan el prompt del LLM, la
 * validación de su respuesta, los filtros de la API y las etiquetas del
 * frontend. Los criterios sirven también para etiquetar los evals a mano,
 * así el modelo y quien etiqueta aplican la misma definición.
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

const option = (value: string, label: string): DimensionOption => ({
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
      option('retail', 'Retail / Tiendas'),
      option('ecommerce', 'E-commerce'),
      option('salud', 'Salud / Clínicas'),
      option('bienestar', 'Belleza / Bienestar / Deporte'),
      option('gastronomia', 'Gastronomía'),
      option('turismo', 'Turismo / Hotelería'),
      option('educacion', 'Educación'),
      option('finanzas_seguros', 'Finanzas / Seguros'),
      option('inmobiliaria', 'Inmobiliaria / Construcción'),
      option('logistica', 'Logística / Transporte'),
      option('tecnologia', 'Tecnología / Software'),
      option('servicios_profesionales', 'Servicios profesionales'),
      option('eventos_entretenimiento', 'Eventos / Entretenimiento'),
      option('ong_publico', 'ONG / Sector público'),
      option('otro', 'Otro'),
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
      option('micro', 'Micro'),
      option('pequena', 'Pequeña'),
      option('mediana', 'Mediana'),
      option('grande', 'Grande'),
      option('no_especificado', 'No especificado'),
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
      option('referido', 'Recomendación / Referido'),
      option('linkedin', 'LinkedIn'),
      option('google', 'Google / Búsqueda'),
      option('redes_sociales', 'Redes sociales (IG, FB, TikTok)'),
      option('evento', 'Evento / Conferencia / Feria'),
      option('contenido', 'Contenido (podcast, artículo, webinar)'),
      option('comunidad', 'Foro / Comunidad'),
      option('otro', 'Otro'),
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
      option('whatsapp', 'WhatsApp'),
      option('telefono', 'Teléfono'),
      option('email', 'Email'),
      option('redes_sociales', 'Redes sociales'),
      option('web', 'Sitio web / Chat'),
      option('multicanal', 'Multicanal'),
      option('no_especificado', 'No especificado'),
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
      option('volumen_alto', 'Volumen inmanejable'),
      option('consultas_repetitivas', 'Consultas repetitivas'),
      option('fuera_de_horario', 'Atención fuera de horario'),
      option('tiempo_respuesta', 'Lentitud de respuesta'),
      option('perdida_ventas', 'Pérdida de ventas / leads'),
      option('crecimiento', 'Escalar por crecimiento'),
      option('experiencia_cliente', 'Mejorar experiencia'),
      option('otro', 'Otro'),
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
      option('faq', 'Preguntas frecuentes'),
      option('catalogo', 'Catálogo / Info de productos'),
      option('agendamiento', 'Agendamiento de citas'),
      option('reservas', 'Reservas'),
      option('pedidos', 'Pedidos / Seguimiento'),
      option('cotizaciones', 'Cotizaciones / Ventas'),
      option('calificacion_leads', 'Calificación de leads'),
      option('soporte', 'Soporte / Postventa'),
      option('pagos', 'Pagos / Cobranza'),
      option('recordatorios', 'Recordatorios'),
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
      option('crm', 'CRM'),
      option('erp', 'ERP'),
      option('agenda', 'Agenda / Turnos'),
      option('pos', 'POS / Caja'),
      option('ecommerce', 'Plataforma e-commerce'),
      option('reservas', 'Sistema de reservas / PMS'),
      option('pagos', 'Pasarela de pagos'),
      option('inventario', 'Inventario / Stock'),
      option('otro', 'Otro sistema'),
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
      option('disponibilidad_24_7', 'Disponibilidad 24/7'),
      option('multicanal', 'Multicanal'),
      option('multiidioma', 'Multiidioma'),
      option('derivacion_humano', 'Derivación a humano'),
      option('tono_marca', 'Tono de marca / Empatía'),
      option('datos_sensibles', 'Seguridad / Datos sensibles'),
      option('personalizacion', 'Personalización'),
    ],
  },
  objections: {
    key: 'objections',
    label: 'Objeciones',
    description: 'Dudas o frenos que expresa el cliente durante la reunión.',
    multi: true,
    hint: 'dudas o frenos explícitos; lista vacía si no hay',
    options: [
      option('precio', 'Precio / Presupuesto'),
      option('comparando', 'Comparando alternativas'),
      option('implementacion', 'Complejidad de implementación'),
      option('seguridad', 'Seguridad / Privacidad'),
      option('calidad_ia', 'Desconfianza en la IA'),
      option('timing', 'No es el momento'),
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
    options: [
      option('alta', 'Alta'),
      option('media', 'Media'),
      option('baja', 'Baja'),
    ],
  },
  complexity: {
    key: 'complexity',
    label: 'Complejidad técnica',
    description:
      'Esfuerzo de implementación estimado (integraciones, idiomas, reglas de negocio).',
    multi: false,
    hint: 'alta = 2 o más integraciones, varios idiomas o datos sensibles; media = 1 integración o algún flujo transaccional; baja = solo informar',
    derived: true,
    options: [
      option('baja', 'Baja'),
      option('media', 'Media'),
      option('alta', 'Alta'),
    ],
  },
  seasonality: {
    key: 'seasonality',
    label: 'Estacionalidad',
    description:
      'Si el cliente menciona períodos con más consultas (temporada alta, fechas especiales, campañas, fines de semana).',
    multi: false,
    hint: 'con_peaks si menciona temporada alta, picos, fechas especiales, campañas o días con más demanda; sin_peaks si no',
    options: [
      option('con_peaks', 'Con peaks / temporada'),
      option('sin_peaks', 'Sin peaks mencionados'),
    ],
  },
} as const satisfies Record<string, DimensionDefinition>;
