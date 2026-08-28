import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, loginAsAdmin } from './utils/bootstrap';
import { PrismaService } from '../src/database/prisma.service';

const BASE = Date.now();
const isoDate = (days: number) =>
  new Date(BASE + days * 86_400_000).toISOString().slice(0, 10);

describe('Room availability (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cookie: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    cookie = await loginAsAdmin(app);
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

  async function makeReservation(over: {
    roomId: number;
    checkIn: string;
    checkOut: string;
    status: string;
    email?: string;
  }) {
    const customer = await prisma.customer.create({
      data: {
        firstName: 'Grace',
        lastName: 'Hopper',
        email: over.email ?? `guest-${Math.random()}@example.com`,
      },
    });
    return prisma.reservation.create({
      data: {
        roomId: over.roomId,
        customerId: customer.id,
        checkIn: new Date(`${over.checkIn}T00:00:00.000Z`),
        checkOut: new Date(`${over.checkOut}T00:00:00.000Z`),
        totalPrice: 100,
        status: over.status,
      },
    });
  }

  it('GET /api/rooms marca la habitación OCCUPIED cuando una reserva cubre hoy', async () => {
    await makeReservation({
      roomId: 1,
      checkIn: isoDate(-2),
      checkOut: isoDate(3),
      status: 'CONFIRMADA',
    });

    const res = await request(app.getHttpServer()).get('/api/rooms').expect(200);
    const room1 = res.body.find((r: { id: number }) => r.id === 1);

    expect(room1.availability.state).toBe('OCCUPIED');
    expect(room1.availability.availableFrom).toBe(isoDate(3));
    // el público no ve datos del huésped
    expect(room1.availability.upcoming).toBeUndefined();
  });

  it('una reserva PENDIENTE futura deja la habitación RESERVED (no OCCUPIED)', async () => {
    await makeReservation({
      roomId: 2,
      checkIn: isoDate(10),
      checkOut: isoDate(14),
      status: 'PENDIENTE',
    });

    const res = await request(app.getHttpServer()).get('/api/rooms').expect(200);
    const room2 = res.body.find((r: { id: number }) => r.id === 2);

    expect(room2.availability.state).toBe('RESERVED');
    expect(room2.availability.nextReservationFrom).toBe(isoDate(10));
  });

  it('GET /api/rooms/admin incluye la lista upcoming con el nombre del huésped', async () => {
    await makeReservation({
      roomId: 3,
      checkIn: isoDate(5),
      checkOut: isoDate(8),
      status: 'CONFIRMADA',
    });

    const res = await request(app.getHttpServer())
      .get('/api/rooms/admin')
      .set('Cookie', cookie)
      .expect(200);
    const room3 = res.body.find((r: { id: number }) => r.id === 3);

    expect(room3.availability.upcoming).toHaveLength(1);
    expect(room3.availability.upcoming[0]).toMatchObject({
      status: 'CONFIRMADA',
      guestName: 'Grace Hopper',
    });
  });

  it('habitación sin reservas -> AVAILABLE', async () => {
    const res = await request(app.getHttpServer()).get('/api/rooms').expect(200);
    for (const room of res.body) {
      expect(room.availability.state).toBe('AVAILABLE');
    }
  });

  describe('POST /api/reservations/run-maintenance', () => {
    it('cierra CONFIRMADA vencidas y cancela PENDIENTE vencidas', async () => {
      const done = await makeReservation({
        roomId: 4,
        checkIn: isoDate(-10),
        checkOut: isoDate(-3),
        status: 'CONFIRMADA',
      });
      const stale = await makeReservation({
        roomId: 5,
        checkIn: isoDate(-1),
        checkOut: isoDate(4),
        status: 'PENDIENTE',
      });

      const res = await request(app.getHttpServer())
        .post('/api/reservations/run-maintenance')
        .set('Cookie', cookie)
        .expect(201);

      expect(res.body).toEqual({ completed: 1, expired: 1 });

      const after = await prisma.reservation.findMany({
        where: { id: { in: [done.id, stale.id] } },
        orderBy: { id: 'asc' },
      });
      expect(after.map((r) => r.status)).toEqual(['COMPLETADA', 'CANCELADA']);
    });

    it('requiere sesión con permiso reservations:update', async () => {
      await request(app.getHttpServer())
        .post('/api/reservations/run-maintenance')
        .expect(401);
    });
  });

  it('PATCH /api/reservations/:id/status devuelve la reserva con room y customer', async () => {
    const r = await makeReservation({
      roomId: 2,
      checkIn: isoDate(20),
      checkOut: isoDate(23),
      status: 'PENDIENTE',
      email: 'patch-status@example.com',
    });

    const res = await request(app.getHttpServer())
      .patch(`/api/reservations/${r.id}/status`)
      .set('Cookie', cookie)
      .send({ status: 'CONFIRMADA' })
      .expect(200);

    expect(res.body.status).toBe('CONFIRMADA');
    expect(res.body.room?.name).toBeTruthy();
    expect(res.body.customer?.email).toBe('patch-status@example.com');
  });
});
