import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { createTestApp, loginAsAdmin } from './utils/bootstrap';
import { PrismaService } from '../src/database/prisma.service';

// Verifica la cadena AuthGuard -> PermissionsGuard end-to-end contra una base
// de datos real (roles y permisos sembrados).
describe('RBAC (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const noPermsEmail = 'sinpermisos@example.com';
  const noPermsPassword = 'sinpermisos123';

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    // Usuario activo pero con un rol vacío: pasa AuthGuard, no PermissionsGuard.
    const role = await prisma.role.upsert({
      where: { name: 'lector-nada' },
      update: {},
      create: { name: 'lector-nada', description: 'rol sin permisos (tests)' },
    });
    const user = await prisma.user.upsert({
      where: { email: noPermsEmail },
      update: { isActive: true },
      create: {
        email: noPermsEmail,
        name: 'Sin Permisos',
        passwordHash: await bcrypt.hash(noPermsPassword, 10),
        isActive: true,
      },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { userId: user.id, roleId: role.id },
    });
  });

  afterAll(async () => {
    await prisma.userRole.deleteMany({ where: { user: { email: noPermsEmail } } });
    await prisma.user.deleteMany({ where: { email: noPermsEmail } });
    await prisma.role.deleteMany({ where: { name: 'lector-nada' } });
    await app.close();
  });

  it('GET /api/reservations sin sesión -> 401', async () => {
    await request(app.getHttpServer()).get('/api/reservations').expect(401);
  });

  it('GET /api/reservations con cookie basura -> 401', async () => {
    await request(app.getHttpServer())
      .get('/api/reservations')
      .set('Cookie', ['access_token=no-es-un-jwt'])
      .expect(401);
  });

  it('GET /api/reservations como admin -> 200', async () => {
    const cookie = await loginAsAdmin(app);
    await request(app.getHttpServer())
      .get('/api/reservations')
      .set('Cookie', cookie)
      .expect(200);
  });

  it('GET /api/reservations autenticado pero sin el permiso reservations:read -> 403', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: noPermsEmail, password: noPermsPassword })
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/reservations')
      .set('Cookie', login.headers['set-cookie'])
      .expect(403);
  });

  it('POST /api/contact-messages es público (no requiere sesión)', async () => {
    await request(app.getHttpServer())
      .post('/api/contact-messages')
      .send({
        name: 'Visitante',
        email: 'visita@example.com',
        message: 'Hola, quiero información',
      })
      .expect(201);
    await prisma.contactMessage.deleteMany({
      where: { email: 'visita@example.com' },
    });
  });
});
