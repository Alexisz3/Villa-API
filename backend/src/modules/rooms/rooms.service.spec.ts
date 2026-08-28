import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { PrismaService } from '../../database/prisma.service';
import { AvailabilityService } from './availability.service';

const prismaMock = {
  room: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

// Pasa las habitaciones tal cual (con un availability de relleno). El cálculo
// real se prueba en availability.service.spec.ts.
const availabilityMock = {
  attach: jest.fn((rooms: unknown[]) =>
    Promise.resolve(
      rooms.map((room) => ({
        ...(room as object),
        availability: { state: 'AVAILABLE', availableFrom: null, nextReservationFrom: null },
      })),
    ),
  ),
};

describe('RoomsService', () => {
  let service: RoomsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AvailabilityService, useValue: availabilityMock },
      ],
    }).compile();
    service = module.get<RoomsService>(RoomsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll (público)', () => {
    it('sólo trae habitaciones activas y con status active', async () => {
      prismaMock.room.findMany.mockResolvedValue([]);
      await service.findAll();

      const where = prismaMock.room.findMany.mock.calls[0][0].where;
      expect(where.isActive).toBe(true);
      expect(where.status).toEqual({ equals: 'active', mode: 'insensitive' });
    });
  });

  describe('findAllForAdmin', () => {
    it('trae todas las habitaciones sin filtro de estado', async () => {
      prismaMock.room.findMany.mockResolvedValue([]);
      await service.findAllForAdmin();

      expect(prismaMock.room.findMany.mock.calls[0][0].where).toBeUndefined();
    });
  });

  describe('findAvailableRooms', () => {
    it('excluye habitaciones con reservas PENDIENTE/CONFIRMADA que se cruzan (no COMPLETADA ni CANCELADA)', async () => {
      prismaMock.room.findMany.mockResolvedValue([]);
      await service.findAvailableRooms('2026-09-10', '2026-09-12');

      const where = prismaMock.room.findMany.mock.calls[0][0].where;
      expect(where.reservations.none.status).toEqual({
        in: ['PENDIENTE', 'CONFIRMADA'],
      });
    });
  });

  describe('findOne', () => {
    it('lanza NotFound cuando la habitación no existe', async () => {
      prismaMock.room.findUnique.mockResolvedValue(null);
      await expect(service.findOne(1)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('lanza NotFound antes de intentar actualizar', async () => {
      prismaMock.room.findUnique.mockResolvedValue(null);
      await expect(service.update(1, { name: 'x' } as any)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prismaMock.room.update).not.toHaveBeenCalled();
    });

    it('actualiza cuando la habitación existe', async () => {
      prismaMock.room.findUnique.mockResolvedValue({ id: 1 });
      prismaMock.room.update.mockResolvedValue({ id: 1, name: 'Nueva' });

      await service.update(1, { name: 'Nueva' } as any);

      expect(prismaMock.room.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Nueva' },
      });
    });
  });
});
