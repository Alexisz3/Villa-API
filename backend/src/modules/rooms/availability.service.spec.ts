import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityService } from './availability.service';
import { PrismaService } from '../../database/prisma.service';

const prismaMock = {
  reservation: { findMany: jest.fn() },
};

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const resv = (
  over: Partial<{
    id: number;
    roomId: number;
    checkIn: string;
    checkOut: string;
    status: string;
    customer: { firstName: string; lastName: string } | null;
  }> = {},
) => ({
  id: over.id ?? 1,
  roomId: over.roomId ?? 1,
  checkIn: d(over.checkIn ?? '2026-03-20'),
  checkOut: d(over.checkOut ?? '2026-03-25'),
  status: over.status ?? 'CONFIRMADA',
  customer: over.customer ?? { firstName: 'Ada', lastName: 'Lovelace' },
});

describe('AvailabilityService', () => {
  let service: AvailabilityService;

  beforeAll(() => {
    jest.useFakeTimers({ now: new Date('2026-03-15T12:00:00.000Z') });
  });
  afterAll(() => jest.useRealTimers());

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get(AvailabilityService);
  });

  it('AVAILABLE cuando la habitación no tiene reservas activas', async () => {
    prismaMock.reservation.findMany.mockResolvedValue([]);
    const [room] = await service.attach([{ id: 1 }]);
    expect(room.availability.state).toBe('AVAILABLE');
    expect(room.availability.availableFrom).toBeNull();
    expect(room.availability.nextReservationFrom).toBeNull();
  });

  it('RESERVED cuando solo hay reservas futuras', async () => {
    prismaMock.reservation.findMany.mockResolvedValue([
      resv({ checkIn: '2026-04-01', checkOut: '2026-04-05' }),
    ]);
    const [room] = await service.attach([{ id: 1 }]);
    expect(room.availability.state).toBe('RESERVED');
    expect(room.availability.nextReservationFrom).toBe('2026-04-01');
  });

  it('OCCUPIED cuando una reserva cubre el día de hoy; se libera el día de salida', async () => {
    prismaMock.reservation.findMany.mockResolvedValue([
      resv({ checkIn: '2026-03-10', checkOut: '2026-03-18' }),
    ]);
    const [room] = await service.attach([{ id: 1 }]);
    expect(room.availability.state).toBe('OCCUPIED');
    expect(room.availability.availableFrom).toBe('2026-03-18');
  });

  it('OCCUPIED con reservas encadenadas: availableFrom es el fin del bloque continuo', async () => {
    prismaMock.reservation.findMany.mockResolvedValue([
      resv({ id: 1, checkIn: '2026-03-12', checkOut: '2026-03-18' }),
      resv({ id: 2, checkIn: '2026-03-18', checkOut: '2026-03-22' }),
      resv({ id: 3, checkIn: '2026-03-22', checkOut: '2026-03-24' }),
      // hueco: esta empieza después, no cuenta para el bloque
      resv({ id: 4, checkIn: '2026-03-28', checkOut: '2026-03-30' }),
    ]);
    const [room] = await service.attach([{ id: 1 }]);
    expect(room.availability.state).toBe('OCCUPIED');
    expect(room.availability.availableFrom).toBe('2026-03-24');
  });

  it('incluye la lista upcoming con nombre del huésped solo cuando includeGuest=true', async () => {
    prismaMock.reservation.findMany.mockResolvedValue([
      resv({ id: 7, checkIn: '2026-04-01', checkOut: '2026-04-03', status: 'PENDIENTE' }),
    ]);

    const [adminRoom] = await service.attach([{ id: 1 }], { includeGuest: true });
    expect(adminRoom.availability.upcoming).toEqual([
      {
        id: 7,
        checkIn: '2026-04-01',
        checkOut: '2026-04-03',
        status: 'PENDIENTE',
        guestName: 'Ada Lovelace',
      },
    ]);

    const [publicRoom] = await service.attach([{ id: 1 }]);
    expect(publicRoom.availability.upcoming).toBeUndefined();
  });

  it('consulta solo estados que bloquean y reservas que no terminaron', async () => {
    prismaMock.reservation.findMany.mockResolvedValue([]);
    await service.attach([{ id: 1 }, { id: 2 }]);
    const where = prismaMock.reservation.findMany.mock.calls[0][0].where;
    expect(where.status).toEqual({ in: ['PENDIENTE', 'CONFIRMADA'] });
    expect(where.roomId).toEqual({ in: [1, 2] });
    expect(where.checkOut.gt).toEqual(new Date('2026-03-15T00:00:00.000Z'));
  });

  it('devuelve [] sin tocar la BD para una lista vacía', async () => {
    const result = await service.attach([]);
    expect(result).toEqual([]);
    expect(prismaMock.reservation.findMany).not.toHaveBeenCalled();
  });
});
