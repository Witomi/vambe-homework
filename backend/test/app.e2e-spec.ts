import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

interface ClientsBody {
  total: number;
  items: { id: string; seller: string; closed: boolean }[];
}

describe('API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health', () => {
    return request(app.getHttpServer()).get('/health').expect(200);
  });

  it('GET /meta expone la taxonomía y los vendedores', async () => {
    const res = await request(app.getHttpServer()).get('/meta').expect(200);
    const body = res.body as {
      dimensions: { key: string }[];
      sellers: string[];
      categorization: { total: number };
    };
    expect(body.dimensions.map((d) => d.key)).toContain('industry');
    expect(body.sellers.length).toBeGreaterThan(0);
    expect(body.categorization.total).toBeGreaterThan(0);
  });

  it('GET /clients pagina y combina filtros', async () => {
    const res = await request(app.getHttpServer())
      .get('/clients')
      .query({ sellers: 'Puma', closed: 'true', pageSize: 5 })
      .expect(200);
    const body = res.body as ClientsBody;
    expect(body.items).toHaveLength(5);
    expect(body.items.every((c) => c.seller === 'Puma' && c.closed)).toBe(true);
  });

  it('GET /clients rechaza valores fuera de la taxonomía', () => {
    return request(app.getHttpServer())
      .get('/clients')
      .query({ industry: 'mineria_espacial' })
      .expect(400);
  });

  it('GET /clients/:id devuelve 404 si no existe', () => {
    return request(app.getHttpServer()).get('/clients/no-existe').expect(404);
  });

  it('GET /metrics respeta los filtros', async () => {
    const res = await request(app.getHttpServer())
      .get('/metrics')
      .query({ closed: 'false' })
      .expect(200);
    const body = res.body as { kpis: { closed: number; meetings: number } };
    expect(body.kpis.closed).toBe(0);
    expect(body.kpis.meetings).toBeGreaterThan(0);
  });

  it('GET /metrics compara el mes pedido, o nada en modo histórico', async () => {
    const month = await request(app.getHttpServer())
      .get('/metrics')
      .query({ period: '2024-06' })
      .expect(200);
    expect(
      (month.body as { monthComparison: { current: { month: string } } })
        .monthComparison.current.month,
    ).toBe('2024-06');

    const historic = await request(app.getHttpServer())
      .get('/metrics')
      .query({ period: 'historico' })
      .expect(200);
    expect(
      (historic.body as { monthComparison: unknown }).monthComparison,
    ).toBeNull();

    await request(app.getHttpServer())
      .get('/metrics')
      .query({ period: '2024-13' })
      .expect(400);
  });

  it('GET /opportunities devuelve las cinco secciones de acción', async () => {
    const res = await request(app.getHttpServer())
      .get('/opportunities')
      .expect(200);
    const body = res.body as Record<string, unknown>;
    expect(Object.keys(body)).toEqual(
      expect.arrayContaining([
        'quadrants',
        'solutions',
        'recovery',
        'assignments',
        'blockers',
      ]),
    );
  });

  it('GET /sellers devuelve la tabla vendedor × industria', async () => {
    const res = await request(app.getHttpServer()).get('/sellers').expect(200);
    const body = res.body as {
      sellers: { seller: string }[];
      industries: { sellers: unknown[] }[];
    };
    expect(body.sellers.length).toBeGreaterThan(0);
    for (const row of body.industries) {
      expect(row.sellers).toHaveLength(body.sellers.length);
    }
  });

  it('GET /prediction devuelve calidad del modelo y distribución', async () => {
    const res = await request(app.getHttpServer())
      .get('/prediction')
      .expect(200);
    const body = res.body as {
      quality: { auc: number; sampleSize: number };
      buckets: { closed: number; open: number }[];
    };
    expect(body.quality.auc).toBeGreaterThan(0);
    const total = body.buckets.reduce((s, b) => s + b.closed + b.open, 0);
    expect(total).toBe(body.quality.sampleSize);
  });

  it('GET /clients filtra por nota y ordena por probabilidad', async () => {
    const res = await request(app.getHttpServer())
      .get('/clients')
      .query({ grade: 'A', sortBy: 'probability', pageSize: 10 })
      .expect(200);
    const items = (
      res.body as {
        items: { prediction: { grade: string; probability: number } }[];
      }
    ).items;
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((c) => c.prediction.grade === 'A')).toBe(true);
    const probs = items.map((c) => c.prediction.probability);
    expect(probs).toEqual([...probs].sort((a, b) => b - a));
  });
});
