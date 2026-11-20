# Vambe Insights

**Demo:** https://vambe-homework.vercel.app

> El backend usa el plan gratuito de Render, que apaga el servidor tras 15 minutos sin visitas. Un monitor lo consulta cada 5 minutos para mantenerlo encendido; si aun así la primera carga tarda o muestra un error, espera ~1 minuto mientras arranca y recarga la página.

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

> La arquitectura, las dimensiones elegidas y las decisiones técnicas están en [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Stack

- **Frontend** — Next.js 15 (App Router, Server Components), React 19, Tailwind CSS 4, Recharts
- **Backend** — NestJS 11, TypeScript, class-validator, Zod
- **LLM** — Gemma 4 (`gemma-4-26b-a4b-it`, respaldo `gemma-4-31b-it`) vía la API de Google AI Studio

## Requisitos

- Node.js 24 LTS (ver `.nvmrc`; con nvm: `nvm use`)
- Una API key gratuita de [Google AI Studio](https://aistudio.google.com/apikey) — **solo** si quieres volver a categorizar; el repo ya incluye los resultados.

## Correr en local

Primero el backend y después el frontend, cada uno en su propia terminal. El frontend necesita que el backend esté corriendo para mostrar datos.

### 1. Backend (API en http://localhost:3001)

```bash
cd backend
npm install
cp .env.example .env         # funciona tal cual; la API key solo se usa para categorizar
npm run start:dev            # modo desarrollo, se reinicia al guardar
```

Para comprobar que está arriba: http://localhost:3001/api/health debe responder `{"status":"ok",…}`.

El repo incluye `backend/data/categorizations.json` con **las 10.000 reuniones** ya categorizadas, así que la API funciona sin API key. Al arrancar, el backend carga el CSV y las categorizaciones en memoria y entrena el modelo de predicción (unos segundos).

### 2. Frontend (panel en http://localhost:3000)

```bash
cd frontend
npm install
cp .env.example .env.local   # apunta a http://localhost:3001/api
npm run dev
```

Abre http://localhost:3000.

### Atajo: los dos juntos

Desde la raíz del repo, un solo comando instala y levanta ambos (después de copiar los dos `.env` como arriba):

```bash
npm run install:all
npm run dev                  # backend en :3001 y frontend en :3000
```

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

La precisión se mide contra `data/evaluation/gold.json`, el *gold standard* (término estándar en evaluación de modelos): casos con su categorización correcta, contra los que se compara la respuesta del LLM.

```bash
cd backend
npm run evaluate -- --init 50   # genera data/evaluation/gold.json con 50 casos al azar
# Revisar cada caso con los criterios de dimensions.ts, corregir "expected" y marcar "reviewed": true
npm run evaluate                # reporta el acierto por dimensión y el promedio por caso
npm run evaluate -- --cases     # agrega el acierto de cada caso y qué campos fallaron
```

El reporte muestra el acierto exacto por dimensión; en las dimensiones de lista (como casos de uso), también qué parte de la lista acertó aunque no sea completa (solapamiento), y cuántas veces el volumen de consultas queda dentro de ±20%. La plantilla trae pre-cargada la respuesta del modelo para acelerar la revisión; conviene leer la transcripción antes de mirarla, para no sesgarse.

El acierto actual (96% de las dimensiones correctas por caso, sobre 50 casos) y el detalle por dimensión están en [ARCHITECTURE.md](ARCHITECTURE.md#precisión-del-llm).

## Tests y calidad de código

| Dónde | Comando | Qué hace |
| --- | --- | --- |
| raíz | `npm test` | Corre todos los tests (backend y frontend) |
| backend | `npm test` | Tests unitarios (parser, filtros, agregaciones, servicio de categorización) |
| frontend | `npm test` | Tests de la lógica pura (filtros ↔ URL, chips, formato, esquemas Zod) |
| raíz | `npm run build` | Compila backend y frontend |
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

## Despliegue

El servidor desplegado solo consulta los datos ya categorizados (`backend/data/categorizations.json`); no configures `GEMINI_API_KEY` en el hosting. El porqué está en [ARCHITECTURE.md](ARCHITECTURE.md#6-categorización-offline-el-despliegue-solo-consulta).

- **Backend → Render**: el repo incluye `render.yaml`. En Render: *New → Blueprint*, elige el repo y define `FRONTEND_URL` con la URL de Vercel.
- **Frontend → Vercel**: importa el repo con *Root Directory* `frontend` y define `NEXT_PUBLIC_API_URL=https://<backend>.onrender.com/api`.

## Próximas mejoras

- **Categorización en producción**: procesar cada reunión nueva a medida que llega (desde el CRM o subiendo un CSV en la app) con una cola de trabajos, Postgres, versión del prompt guardada en cada categorización y evals como control de calidad antes de cambiar el prompt. Detalle en [ARCHITECTURE.md](ARCHITECTURE.md#próximas-mejoras).
