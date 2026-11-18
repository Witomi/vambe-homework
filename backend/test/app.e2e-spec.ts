import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/app.setup';

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
});
