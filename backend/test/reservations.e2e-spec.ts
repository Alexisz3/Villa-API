import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/bootstrap';
import { PrismaService } from '../src/database/prisma.service';

// Fechas siempre en el futuro para pasar la validación "checkIn > ahora".
// Base fija (capturada una vez) para que las diferencias de noches sean
// exactas y no dependan del milisegundo en que se llama.
const BASE = Date.now();
const inDays = (days: number) =>
  new Date(BASE + days * 86_400_000).toISOString();

describe('Reservations (e2e) — anti-solapamiento', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE reservations, customers RESTART IDENTITY CASCADE',
    );
    await app.close();
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE reservations, customers RESTART IDENTITY CASCADE',
    );
  });

  const booking = (over: Partial<Record<string, unknown>> = {}) => ({
    roomId: 1,
    checkIn: inDays(10),
    checkOut: inDays(14),
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    ...over,
  });

  it('crea una reserva válida (201) y calcula el precio por noche', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/reservations')
      .send(booking())
      .expect(201);

    // room 1 = "Los Chicos" a 120/noche * 4 noches
    expect(Number(res.body.totalPrice)).toBe(480);
    expect(res.body.status).toBe('PENDIENTE');
  });

  it('rechaza (400) una segunda reserva que se cruza con la primera', async () => {
    await request(app.getHttpServer()).post('/api/reservations').send(booking()).expect(201);

    const res = await request(app.getHttpServer())
      .post('/api/reservations')
      .send(booking({ email: 'otro@example.com', checkIn: inDays(12), checkOut: inDays(16) }))
      .expect(400);

    expect(res.body.message).toMatch(/ya está reservada/i);
  });

  it('permite reservas consecutivas que sólo se tocan en el borde (checkout == checkin)', async () => {
    await request(app.getHttpServer())
      .post('/api/reservations')
      .send(booking({ checkIn: inDays(10), checkOut: inDays(12) }))
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/reservations')
      .send(booking({ email: 'b@example.com', checkIn: inDays(12), checkOut: inDays(14) }))
      .expect(201);
  });

  it('la constraint EXCLUDE de Postgres bloquea el cruce aunque se salte la lógica del servicio', async () => {
    // Inserción directa por Prisma, sin pasar por ReservationsService: sólo la
    // restricción a nivel de base de datos puede frenar esto (race condition).
    const customer = await prisma.customer.create({
      data: { firstName: 'Race', lastName: 'Cond', email: 'race@example.com' },
    });

    await prisma.reservation.create({
      data: {
        roomId: 1,
        customerId: customer.id,
        checkIn: new Date(inDays(20)),
        checkOut: new Date(inDays(25)),
        totalPrice: 100,
        status: 'PENDIENTE',
      },
    });

    await expect(
      prisma.reservation.create({
        data: {
          roomId: 1,
          customerId: customer.id,
          checkIn: new Date(inDays(22)),
          checkOut: new Date(inDays(27)),
          totalPrice: 100,
          status: 'PENDIENTE',
        },
      }),
    ).rejects.toThrow(/23P01|reservations_no_overlap|exclusion/i);
  });

  it('acepta un teléfono en formato local (opcional, sin validación estricta)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/reservations')
      .send(booking({ phone: '0987366584', email: 'tel@example.com' }))
      .expect(201);
    expect(res.body.id).toBeDefined();
  });

  it('acepta la reserva sin teléfono', async () => {
    await request(app.getHttpServer())
      .post('/api/reservations')
      .send(booking({ email: 'sintel@example.com' }))
      .expect(201);
  });

  it('una reserva CANCELADA libera las fechas para una nueva', async () => {
    const first = await request(app.getHttpServer())
      .post('/api/reservations')
      .send(booking())
      .expect(201);

    await prisma.reservation.update({
      where: { id: first.body.id },
      data: { status: 'CANCELADA' },
    });

    await request(app.getHttpServer())
      .post('/api/reservations')
      .send(booking({ email: 'nuevo@example.com' }))
      .expect(201);
  });

  it('una reserva COMPLETADA tampoco bloquea esas fechas (la estadía terminó)', async () => {
    const first = await request(app.getHttpServer())
      .post('/api/reservations')
      .send(booking())
      .expect(201);

    await prisma.reservation.update({
      where: { id: first.body.id },
      data: { status: 'COMPLETADA' },
    });

    await request(app.getHttpServer())
      .post('/api/reservations')
      .send(booking({ email: 'otro-mas@example.com' }))
      .expect(201);
  });

  it('crea la reserva devolviéndola con room y customer', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/reservations')
      .send(booking())
      .expect(201);
    expect(res.body.room?.name).toBeTruthy();
    expect(res.body.customer?.email).toBe('ada@example.com');
  });
});
