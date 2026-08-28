import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/bootstrap';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/auth/login rechaza credenciales inválidas con 401', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@villaanamaria.com', password: 'contraseña-mala' })
      .expect(401);
  });

  it('POST /api/auth/login valida el DTO (email mal formado -> 400)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'no-es-email', password: 'x' })
      .expect(400);
  });

  it('POST /api/auth/login exitoso setea una cookie httpOnly y no expone el token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@villaanamaria.com', password: process.env.ADMIN_SEED_PASSWORD || 'AdminVilla2026!' })
      .expect(201);

    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toMatch(/access_token=/);
    expect(cookie.toLowerCase()).toContain('httponly');
    expect(res.body).not.toHaveProperty('access_token');
  });

  it('GET /api/auth/me sin cookie -> 401', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('GET /api/auth/me con cookie -> devuelve el usuario', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@villaanamaria.com', password: process.env.ADMIN_SEED_PASSWORD || 'AdminVilla2026!' });

    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', login.headers['set-cookie'])
      .expect(200);

    expect(res.body).toMatchObject({ email: 'admin@villaanamaria.com' });
    expect(res.body).not.toHaveProperty('passwordHash');
  });
});
