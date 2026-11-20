import { Categories } from './categories';

type ComplexityInput = Pick<
  Categories,
  'integrations' | 'requirements' | 'useCases'
>;

/** Casos de uso que son solo informar; el resto implica un flujo con pasos. */
const INFORMATIVE_USE_CASES: readonly string[] = ['faq', 'catalogo'];

/**
 * Complejidad técnica estimada, calculada a partir de lo que pidió el cliente:
 * - alta: 2 o más integraciones, varios idiomas o datos sensibles;
 * - media: 1 integración o algún flujo transaccional (agendar, cotizar, …);
 * - baja: solo informar (preguntas frecuentes o catálogo).
 *
 * Se calcula en código y no la responde el LLM: es una regla fija sobre
 * otras dimensiones, y el LLM la aplicaba de forma inconsistente.
 */
export function deriveComplexity(c: ComplexityInput): Categories['complexity'] {
  const sensitive = c.requirements.some(
    (r) => r === 'multiidioma' || r === 'datos_sensibles',
  );
  if (c.integrations.length >= 2 || sensitive) return 'alta';
  const transactional = c.useCases.some(
    (u) => !INFORMATIVE_USE_CASES.includes(u),
  );
  if (c.integrations.length === 1 || transactional) return 'media';
  return 'baja';
}
