import { DimensionKey } from '../domain/taxonomy';

/**
 * Acción sugerida para cada rasgo que baja la conversión.
 * Es conocimiento de negocio, no del modelo: vive aquí para que el equipo
 * comercial lo pueda ajustar sin tocar la lógica.
 */
const ACTIONS: Partial<Record<DimensionKey, Record<string, string>>> = {
  requirements: {
    datos_sensibles:
      'Preparar material de seguridad y cumplimiento (cifrado, retención de datos) para mostrar en la primera reunión.',
    multiidioma: 'Mostrar en la demo una conversación real en otro idioma.',
    disponibilidad_24_7:
      'Demostrar la atención fuera de horario con métricas de un cliente actual.',
    derivacion_humano:
      'Explicar el flujo de derivación a una persona con un caso concreto.',
    multicanal:
      'Mostrar en la demo el mismo asistente funcionando en WhatsApp, web e Instagram.',
    tono_marca:
      'Llevar ejemplos de asistentes personalizados con distintos tonos de marca.',
    personalizacion:
      'Preparar una demo configurada con el catálogo o servicios del propio cliente.',
  },
  objections: {
    precio:
      'Ofrecer un plan de entrada o un piloto acotado con resultados medibles.',
    comparando:
      'Llevar una comparación honesta con alternativas y casos de éxito del mismo rubro.',
    implementacion:
      'Presentar un plan de implementación por etapas con plazos concretos.',
    seguridad: 'Compartir la documentación de seguridad antes de que la pidan.',
    calidad_ia: 'Hacer una prueba en vivo con preguntas reales del cliente.',
    timing: 'Agendar un seguimiento en la fecha que el cliente indique.',
  },
  integrations: {},
  painPoint: {
    crecimiento:
      'Enfocar el pitch en cómo escala la atención sin contratar más personas.',
  },
};

const DEFAULTS: Partial<Record<DimensionKey, (label: string) => string>> = {
  integrations: (label) =>
    `Revisar el conector con ${label}: si es débil, priorizarlo en el roadmap; si existe, mostrarlo en la demo.`,
  useCases: (label) => `Preparar una demo específica de «${label}».`,
};

export function suggestedAction(
  dimension: DimensionKey,
  value: string,
  label: string,
): string {
  return (
    ACTIONS[dimension]?.[value] ??
    DEFAULTS[dimension]?.(label) ??
    `Revisar el pitch para clientes con «${label}».`
  );
}
