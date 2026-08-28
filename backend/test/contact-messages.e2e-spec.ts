import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, loginAsAdmin } from './utils/bootstrap';
import { PrismaService } from '../src/database/prisma.service';

describe('Contact messages (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cookie: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    cookie = await loginAsAdmin(app);
  });

  afterAll(async () => {
    await prisma.contactMessage.deleteMany({
      where: { email: { contains: '@e2e-contact.test' } },
    });
    await app.close();
  });

  const payload = (over: Record<string, unknown> = {}) => ({
    name: 'Visitante Prueba',
    email: `v${Date.now()}${Math.random().toString(36).slice(2, 6)}@e2e-contact.test`,
    phone: '0987654321',
    subject: 'consulta',
    message: 'Quiero información sobre disponibilidad.',
    ...over,
  });

  it('registra un contacto del canal WhatsApp (además de que el front abra wa.me)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/contact-messages')
      .send(payload({ channel: 'whatsapp' }))
      .expect(201);

    expect(res.body.channel).toBe('whatsapp');
    expect(res.body.subject).toBe('consulta');
    expect(res.body.status).toBe('pendiente');
  });

  it('sin canal explícito guarda "email" por defecto', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/contact-messages')
      .send(payload())
      .expect(201);
    expect(res.body.channel).toBe('email');
  });

  it('rechaza un canal desconocido (400)', async () => {
    await request(app.getHttpServer())
      .post('/api/contact-messages')
      .send(payload({ channel: 'telegram' }))
      .expect(400);
  });

  it('exige nombre, email y mensaje válidos (400)', async () => {
    await request(app.getHttpServer())
      .post('/api/contact-messages')
      .send(payload({ name: 'A', email: 'no-es-email', message: 'x' }))
      .expect(400);
  });

  it('GET /api/contact-messages (admin) devuelve canal y asunto', async () => {
    await request(app.getHttpServer())
      .post('/api/contact-messages')
      .send(payload({ channel: 'whatsapp', subject: 'soporte' }))
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/api/contact-messages')
      .set('Cookie', cookie)
      .expect(200);

    const whatsapp = res.body.find(
      (m: { channel: string; subject: string }) =>
        m.channel === 'whatsapp' && m.subject === 'soporte',
    );
    expect(whatsapp).toBeTruthy();
  });
});
