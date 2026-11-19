/**
 * Esquemas de las respuestas del backend, uno por endpoint.
 *
 * Son el contrato del frontend con la API: cada respuesta se valida al
 * llegar, así un cambio incompatible en el backend falla con un error
 * claro en vez de propagarse como `undefined` hasta un gráfico.
 * Los tipos de TypeScript se derivan de aquí (`z.infer`), sin duplicarlos.
 */
export * from './shared';
export * from './meta';
export * from './clients';
export * from './metrics';
export * from './opportunities';
export * from './prediction';
