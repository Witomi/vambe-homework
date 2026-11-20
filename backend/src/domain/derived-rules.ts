/**
 * Reglas fijas que se calculan en código después de que responde el LLM.
 *
 * Son reglas objetivas sobre datos que el LLM ya extrajo (integraciones,
 * requisitos, casos de uso, volumen). Pedírselas al modelo daba resultados
 * inconsistentes; calcularlas aquí garantiza que se apliquen siempre igual.
 */
import { Categories } from './categories';
import { HIGH_VOLUME_MONTHLY } from './volume';

type ComplexityInput = Pick<
  Categories,
  'integrations' | 'requirements' | 'useCases'
>;

/** Casos de uso que son solo informar; el resto implica un flujo con pasos. */
const INFORMATIVE_USE_CASES: readonly string[] = ['faq', 'catalogo'];

/**
 * Complejidad técnica estimada a partir de lo que pidió el cliente:
 * - alta: 2 o más integraciones, varios idiomas o datos sensibles;
 * - media: 1 integración o algún flujo transaccional (agendar, cotizar, …);
 * - baja: solo informar (preguntas frecuentes o catálogo).
 */
export function deriveComplexity(
  categories: ComplexityInput,
): Categories['complexity'] {
  const sensitive = categories.requirements.some(
    (requirement) =>
      requirement === 'multiidioma' || requirement === 'datos_sensibles',
  );
  if (categories.integrations.length >= 2 || sensitive) return 'alta';
  const transactional = categories.useCases.some(
    (useCase) => !INFORMATIVE_USE_CASES.includes(useCase),
  );
  if (categories.integrations.length === 1 || transactional) return 'media';
  return 'baja';
}

/**
 * Dolores con menos prioridad que "volumen alto" en los criterios de
 * `dimensions.ts` (pérdida de ventas y crecimiento van antes).
 */
const BELOW_HIGH_VOLUME: readonly string[] = [
  'fuera_de_horario',
  'tiempo_respuesta',
  'experiencia_cliente',
  'consultas_repetitivas',
  'otro',
];

/**
 * Más de 5.000 consultas al mes es "volumen alto", salvo que haya un dolor
 * más prioritario. El LLM no siempre convierte "250 diarias" a mensual
 * antes de comparar con el umbral.
 */
export function applyHighVolumeRule(
  painPoint: Categories['painPoint'],
  monthlyInquiries: number | null,
): Categories['painPoint'] {
  const high =
    monthlyInquiries !== null && monthlyInquiries > HIGH_VOLUME_MONTHLY;
  return high && BELOW_HIGH_VOLUME.includes(painPoint)
    ? 'volumen_alto'
    : painPoint;
}

/** Aplica todas las reglas fijas sobre la respuesta ya validada del LLM. */
export function applyDerivedRules(
  categories: Omit<Categories, 'complexity'>,
): Categories {
  return {
    ...categories,
    painPoint: applyHighVolumeRule(
      categories.painPoint,
      categories.monthlyInquiries,
    ),
    complexity: deriveComplexity(categories),
  };
}
