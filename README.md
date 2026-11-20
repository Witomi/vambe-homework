# Vambe Insights

Panel comercial que toma las transcripciones de reuniones de venta de Vambe, las **categoriza automáticamente con un LLM (Gemma 4)** y muestra métricas para responder preguntas como:

- ¿Qué rubros y canales de adquisición cierran más y cuáles menos?
- ¿Qué vendedor convierte mejor cada industria? (para asignar leads)
- ¿Qué integraciones y capacidades piden los clientes? (para el roadmap de producto)
- ¿Cuántas consultas mensuales estamos automatizando en los clientes que cerramos?

| Vista | Para qué sirve |
| --- | --- |
| **General** | Tres cifras clave (de un mes elegido, comparado con el mes anterior y el mismo mes del año pasado, o del histórico), los hallazgos más importantes, qué clientes cierran más, qué piden, reuniones por mes y desempeño por vendedor |
| **Vendedores** | Cómo le va a cada vendedor frente a lo esperado según sus rubros, su mejor y peor rubro, y una tabla vendedor × industria comparada con el equipo |
| **Oportunidades** | Qué hacer con los datos: dónde poner el esfuerzo, a quién volver a llamar, qué vendedor toma cada lead, qué frena las ventas y qué solución construir una vez para muchos rubros |
| **Predicción** | Probabilidad de cierre con regresión logística y **notas A–F** por cliente: cuánto cierra realmente cada nota, cerrados vs. no cerrados por probabilidad y qué rasgos la mueven |
| **Clientes** | Búsqueda de texto, filtros por cualquier dimensión, orden, paginación y detalle con transcripción + categorización |

> La arquitectura, las dimensiones elegidas y las decisiones técnicas están en [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Stack

- **Frontend** — Next.js 15 (App Router, Server Components), React 19, Tailwind CSS 4, Recharts
- **Backend** — NestJS 11, TypeScript, class-validator, Zod
- **LLM** — Gemma 4 (`gemma-4-26b-a4b-it`, respaldo `gemma-4-31b-it`) vía la API de Google AI Studio

## Requisitos

- Node.js 24 LTS (ver `.nvmrc`; con nvm: `nvm use`)
- Una API key gratuita de [Google AI Studio](https://aistudio.google.com/apikey) — **solo** si quieres volver a categorizar; el repo ya incluye los resultados.

## Correr en local

```bash
npm run install:all          # instala raíz, backend y frontend
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
npm run dev                  # backend en :3001 y frontend en :3000
```

Abre http://localhost:3000.

El repo incluye `backend/data/categorizations.json` con **las 10.000 reuniones** ya categorizadas, así que la app funciona sin API key.

## Categorizar con el LLM

```bash
# en backend/.env: GEMINI_API_KEY=...
cd backend
npm run categorize            # analiza todas las reuniones pendientes
```

| Opción | Default | Descripción |
| --- | --- | --- |
| `--limit` | todas | Máximo de clientes **pendientes** a procesar (útil para probar con pocos) |
| `--batch` | 10 | Transcripciones por request al LLM |
| `--concurrency` | 5 | Requests simultáneas (respetando el límite de requests por minuto) |

La corrida es **reanudable**: solo procesa clientes sin categorizar y guarda después de cada lote, así que se puede cortar con Ctrl+C y retomar. El backend detecta los cambios en el archivo y actualiza el panel solo, sin reiniciar.

Para volver a categorizar clientes específicos (por ejemplo, después de corregir el prompt), reemplazando su categorización anterior:

```bash
npm run categorize -- --ids a1b2c3d4e5f6,0f9e8d7c6b5a
```

## Medir la precisión del LLM

```bash
cd backend
npm run evaluate -- --init 50   # genera data/evaluation/gold.json con 50 casos al azar
# Revisar cada caso con los criterios de dimensions.ts, corregir "expected" y marcar "reviewed": true
npm run evaluate                # reporta el acierto por dimensión y el promedio por caso
npm run evaluate -- --cases     # agrega el acierto de cada caso y qué campos fallaron
```

El reporte muestra el acierto exacto por dimensión, el solapamiento en las de lista y cuántas veces el volumen de consultas queda dentro de ±20%. La plantilla trae pre-cargada la respuesta del modelo para acelerar la revisión; conviene leer la transcripción antes de mirarla, para no sesgarse.

### Resultados actuales (50 casos etiquetados)

Promedio de 2 corridas a temperatura 0 con el prompt actual. Los criterios de cada dimensión (en `backend/src/domain/dimensions.ts`) se ajustaron mirando 24 casos; los otros 26 se etiquetaron después solo con esos criterios escritos y funcionan como **prueba independiente**: si las reglas solo sirvieran para los casos usados para escribirlas, ahí bajaría el acierto.

**Por caso: 96% de las dimensiones correctas en promedio**; 29 de los 50 casos salen perfectos en ambas corridas.

| Dimensión | Ajuste (24) | Prueba (26) | Total | Prompt anterior (24) |
| --- | --- | --- | --- | --- |
| Industria | 100% | 100% | 100% | 96% |
| Canal de adquisición | 100% | 100% | 100% | 88% |
| Complejidad técnica (calculada) | 100% | 100% | 100% | 63% |
| Estacionalidad | 100% | 100% | 100% | 100% |
| Objeciones | 100% | 100% | 100% | 100% |
| Integraciones | 96% | 100% | 98% | 71% |
| Tamaño | 98% | 96% | 97% | 46% |
| Canal de consultas | 96% | 98% | 97% | 94% |
| Dolor principal | 94% | 96% | 95% | 88% |
| Requisitos clave (solapamiento 97%) | 94% | 94% | 94% | 77% |
| Urgencia | 83% | 100% | 92% | 94% |
| **Casos de uso** (solapamiento 90%) | 79% | 77% | **78%** | 38% |
| Consultas/mes (±20%) | 100% | 92% | 96% | 100% |
| Consultas/mes en peak (±20%) | 100% | 100% | 100% | 100% |

La columna «Prompt anterior» mide el prompt previo contra las mismas etiquetas (solo los 24 casos de ajuste).

Qué cambió:

- **Criterios explícitos por valor**, con orden de prioridad cuando varias reglas aplican. Por ejemplo, el tamaño se decide primero por la cantidad de locales, después por la de empleados y después por cómo se describe el negocio; sin pistas queda «No especificado», en vez de adivinarlo por el rubro o el volumen. «Catálogo» quedó acotado a productos físicos, propiedades, espacios y tours (presentar servicios, programas o un portafolio es «Preguntas frecuentes»).
- **Reglas fijas calculadas en código** en vez de pedírselas al LLM, que las aplicaba de forma inconsistente: la complejidad (a partir de integraciones, requisitos y casos de uso) y el dolor «volumen alto» cuando hay más de 5.000 consultas al mes.
- **El gold se revisó con los mismos criterios.** Había etiquetas contradictorias entre casos parecidos (p. ej. «la conocí a través de un colega en LinkedIn» marcado como referido en un caso y como LinkedIn en otros). Los casos dudosos los decidió una persona.

Lo que falta:

- Los errores que quedan son casos en que Gemma no sigue una regla escrita: marca **urgencia alta** cuando el volumen es grande aunque el cliente no diga que lo supera, omite o agrega algún **caso de uso** suelto y no reconoce «para mejorar atención» como dolor de experiencia. Más ajustes al prompt arreglaban unos casos y rompían otros, así que se dejó en este punto.
- Se descartaron por no mejorar: usar `gemma-4-31b-it` como modelo principal (95% por caso), procesar 1 transcripción por request y activar el razonamiento del modelo (mucho más lentos).
- Las corridas tuvieron muchos errores 503 de la API; en esos casos responde el modelo de respaldo, lo que explica parte de la diferencia entre corridas.

Limitaciones: es una muestra chica (cada caso mueve 2–4 puntos) y las etiquetas no las puso el equipo comercial: un asistente de IA aplicó los criterios escritos y una persona revisó los primeros 24 casos y decidió los dudosos. Las 10.000 reuniones del repo se categorizaron con el prompt anterior; los criterios nuevos aplican a las que se categoricen desde ahora (o al recategorizar todo).

Para comparar cambios de prompt de forma justa: usar temperatura 0 (`LLM_TEMPERATURE=0`), correr cada versión 2–3 veces y comparar promedios.

## Scripts

| Dónde | Comando | Qué hace |
| --- | --- | --- |
| raíz | `npm run dev` | Levanta backend y frontend en paralelo |
| raíz | `npm run build` | Compila ambos |
| raíz | `npm test` | Corre todos los tests (backend unitarios + e2e y frontend) |
| backend | `npm test` | Tests unitarios (parser, filtros, agregaciones, servicio de categorización) |
| frontend | `npm test` | Tests de la lógica pura (filtros ↔ URL, chips, formato, esquemas Zod) |
| backend | `npm run test:e2e` | Tests de la API contra el CSV real |
| backend | `npm run categorize` | Categoriza clientes con Gemma |
| backend | `npm run evaluate` | Mide la precisión del LLM contra etiquetas humanas (ver abajo) |
| ambos | `npm run lint` / `npm run format` | ESLint / Prettier |

## Variables de entorno

**backend/.env**

| Variable | Default | Descripción |
| --- | --- | --- |
| `PORT` | `3001` | Puerto HTTP |
| `FRONTEND_URL` | `http://localhost:3000` | Orígenes CORS permitidos (separados por coma) |
| `DATA_DIR` | `data` | Carpeta con el CSV y las categorizaciones |
| `GEMINI_API_KEY` | — | API key de Google AI Studio (solo para categorizar) |
| `LLM_MODEL` / `LLM_FALLBACK_MODEL` | `gemma-4-26b-a4b-it` / `gemma-4-31b-it` | Modelo principal y de respaldo |
| `LLM_THINKING_LEVEL` | `minimal` | `minimal` reduce la latencia ~10× |
| `LLM_RPM` | `25` | Límite de requests por minuto |
| `LLM_TEMPERATURE` | `0.1` | Temperatura del LLM (usar `0` para evaluar) |

**frontend/.env.local**

| Variable | Descripción |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | URL pública del backend, p. ej. `http://localhost:3001/api` |

## API

| Endpoint | Descripción |
| --- | --- |
| `GET /api/meta` | Taxonomía, vendedores, rango de fechas y cobertura de la categorización |
| `GET /api/metrics?…filtros&period` | KPIs, series y desgloses del segmento filtrado. `period=YYYY-MM` compara ese mes con el anterior y con el mismo mes del año pasado (por defecto, el último mes); `period=historico` muestra solo los totales |
| `GET /api/clients?…filtros&page&pageSize&sortBy&sortDir` | Listado paginado |
| `GET /api/clients/:id` | Detalle con transcripción completa |
| `GET /api/prediction` | Calidad del modelo de cierre, distribución por probabilidad y factores |
| `GET /api/sellers` | Desempeño por vendedor y tabla vendedor × industria |
| `GET /api/opportunities` | Acciones sugeridas: mapa de segmentos, leads recuperables, asignación, frenos y soluciones replicables |

Filtros: `search`, `sellers`, `closed`, `categorized`, `from`, `to`, `volume`, `grade` (A–F) y cada dimensión (`industry`, `leadSource`, …) como lista separada por comas. Los valores se validan contra la taxonomía (400 si no existen).

## Despliegue

**La categorización es un paso offline.** Las 10.000 reuniones se categorizan en local con `npm run categorize` y el resultado (`backend/data/categorizations.json`) se versiona en el repo. El servidor desplegado solo **consulta** esos datos: no necesita la API key de Gemma, no gasta cuota y todos ven los mismos números que miden los evals. Por eso `GEMINI_API_KEY` no se configura en el hosting.

- **Backend → Render**: el repo incluye `render.yaml`. En Render: *New → Blueprint*, elige el repo y define `FRONTEND_URL` con la URL de Vercel.
- **Frontend → Vercel**: importa el repo con *Root Directory* `frontend` y define `NEXT_PUBLIC_API_URL=https://<backend>.onrender.com/api`.

## Próximas mejoras

- **Categorización en producción**: procesar cada reunión nueva a medida que llega (desde el CRM o subiendo un CSV en la app) con una cola de trabajos, Postgres, versión del prompt guardada en cada categorización y evals como control de calidad antes de cambiar el prompt. Detalle en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#categorización-en-producción-propuesta).
