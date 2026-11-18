# Vambe Insights

Panel comercial que toma las transcripciones de reuniones de venta de Vambe, las **categoriza automáticamente con un LLM (Gemma 4)** y muestra métricas para responder preguntas como:

- ¿Qué rubros y canales de adquisición cierran más y cuáles menos?
- ¿Qué vendedor convierte mejor cada industria? (para asignar leads)
- ¿Qué integraciones y capacidades piden los clientes? (para el roadmap de producto)
- ¿Cuántas consultas mensuales estamos automatizando en los clientes que cerramos?

| Panel | Clientes |
| --- | --- |
| KPIs, hallazgos automáticos, evolución mensual, explorador de segmentos, matriz vendedor × industria y señales de producto | Búsqueda de texto, filtros por cualquier dimensión, orden, paginación y detalle con transcripción + categorización |

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

El repo incluye `backend/data/categorizations.json` con una **muestra aleatoria de 1.000 clientes** ya categorizados, así que la app funciona sin API key.

## Categorizar con el LLM

```bash
# en backend/.env: GEMINI_API_KEY=...
cd backend
npm run categorize -- --limit 500 --batch 10 --concurrency 4
```

| Opción | Default | Descripción |
| --- | --- | --- |
| `--limit` | 500 | Cuántos clientes **pendientes** procesar en esta corrida |
| `--batch` | 10 | Transcripciones por request al LLM |
| `--concurrency` | 2 | Requests simultáneas |
| `--seed` | 42 | Semilla de la muestra aleatoria (reproducible) |

La corrida es **reanudable**: solo procesa clientes sin categorizar y guarda después de cada lote, así que se puede cortar con Ctrl+C y retomar. Reinicia el backend para que lea los nuevos resultados.

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

**frontend/.env.local**

| Variable | Descripción |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | URL pública del backend, p. ej. `http://localhost:3001/api` |

## API

| Endpoint | Descripción |
| --- | --- |
| `GET /api/meta` | Taxonomía, vendedores, rango de fechas y cobertura de la categorización |
| `GET /api/metrics?…filtros` | KPIs, series y desgloses del segmento filtrado |
| `GET /api/clients?…filtros&page&pageSize&sortBy&sortDir` | Listado paginado |
| `GET /api/clients/:id` | Detalle con transcripción completa |

Filtros: `search`, `sellers`, `closed`, `categorized`, `from`, `to`, `volume` y cada dimensión (`industry`, `leadSource`, …) como lista separada por comas. Los valores se validan contra la taxonomía (400 si no existen).

## Despliegue

- **Backend → Render**: el repo incluye `render.yaml`. En Render: *New → Blueprint*, elige el repo y define `FRONTEND_URL` con la URL de Vercel.
- **Frontend → Vercel**: importa el repo con *Root Directory* `frontend` y define `NEXT_PUBLIC_API_URL=https://<backend>.onrender.com/api`.
