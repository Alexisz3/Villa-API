import { INestApplication } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { createTestApp } from './utils/bootstrap';
import { PrismaService } from '../src/database/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
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

  describe('recuperar contraseña', () => {
    it('POST /api/auth/forgot-password responde 201 aunque el correo no exista (no filtra)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: 'no-existe@villaanamaria.com' })
        .expect(201);
      expect(res.body).toEqual({ success: true });
    });

    it('POST /api/auth/forgot-password valida el DTO (email mal formado -> 400)', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: 'no-es-email' })
        .expect(400);
    });

    it('POST /api/auth/reset-password rechaza un token inválido con 400', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ token: 'a'.repeat(64), password: 'clave-nueva-1' })
        .expect(400);
    });

    it('POST /api/auth/reset-password valida el largo mínimo de la contraseña (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ token: 'a'.repeat(64), password: 'corta' })
        .expect(400);
    });

    it('flujo completo: un token válido cambia la contraseña y luego queda quemado', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Reset Flow',
          email: `reset-flow-${Date.now()}@test.com`,
          passwordHash: await bcrypt.hash('clave-vieja-1', 10),
        },
      });
      const rawToken = crypto.randomBytes(32).toString('hex');
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: crypto.createHash('sha256').update(rawToken).digest('hex'),
          expiresAt: new Date(Date.now() + 60_000),
        },
      });

      try {
        await request(app.getHttpServer())
          .post('/api/auth/reset-password')
          .send({ token: rawToken, password: 'clave-flamante-2' })
          .expect(201);

        // La nueva contraseña ya sirve para entrar.
        await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email: user.email, password: 'clave-flamante-2' })
          .expect(201);

        // El token no se puede volver a usar.
        await request(app.getHttpServer())
          .post('/api/auth/reset-password')
          .send({ token: rawToken, password: 'otra-mas-3' })
          .expect(400);
      } finally {
        await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    });
  });
});
