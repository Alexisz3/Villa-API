import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { PrismaService } from '../../database/prisma.service';

const prismaMock = {
  room: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  reservation: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

// Fechas siempre relativas a "ahora" para que los tests no caduquen.
const inDays = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString();

const activeRoom = {
  id: 1,
  name: 'La Abuela',
  isActive: true,
  status: 'active',
  pricePerNight: '100',
};

const baseCreateDto = () => ({
  roomId: 1,
  checkIn: inDays(10),
  checkOut: inDays(14),
  firstName: 'Juan',
  lastName: 'Pérez',
  email: 'juan@example.com',
});

describe('ReservationsService', () => {
  let service: ReservationsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get<ReservationsService>(ReservationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('rechaza cuando checkOut no es posterior a checkIn', async () => {
      const dto = { ...baseCreateDto(), checkIn: inDays(14), checkOut: inDays(14) };
      await expect(service.create(dto)).rejects.toThrow(
        'La fecha de salida debe ser mayor a la fecha de entrada.',
      );
      expect(prismaMock.room.findUnique).not.toHaveBeenCalled();
    });

    it('rechaza cuando la fecha de entrada ya pasó', async () => {
      const dto = { ...baseCreateDto(), checkIn: inDays(-2), checkOut: inDays(3) };
      await expect(service.create(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rechaza cuando la habitación no existe', async () => {
      prismaMock.room.findUnique.mockResolvedValue(null);
      await expect(service.create(baseCreateDto())).rejects.toThrow(
        'La cabaña seleccionada no existe.',
      );
    });

    it('rechaza cuando la habitación está inactiva', async () => {
      prismaMock.room.findUnique.mockResolvedValue({
        ...activeRoom,
        isActive: false,
      });
      await expect(service.create(baseCreateDto())).rejects.toThrow(
        /no esta disponible/,
      );
    });

    it('rechaza cuando el status de la habitación no es "active"', async () => {
      prismaMock.room.findUnique.mockResolvedValue({
        ...activeRoom,
        status: 'maintenance',
      });
      await expect(service.create(baseCreateDto())).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rechaza cuando ya hay una reserva que se cruza en esas fechas', async () => {
      prismaMock.room.findUnique.mockResolvedValue(activeRoom);
      prismaMock.reservation.findFirst.mockResolvedValue({ id: 99 });
      await expect(service.create(baseCreateDto())).rejects.toThrow(
        /ya está reservada/,
      );
      expect(prismaMock.reservation.create).not.toHaveBeenCalled();
    });

    it('solo considera PENDIENTE/CONFIRMADA al buscar cruces (ignora CANCELADA y COMPLETADA)', async () => {
      prismaMock.room.findUnique.mockResolvedValue(activeRoom);
      prismaMock.reservation.findFirst.mockResolvedValue(null);
      prismaMock.reservation.create.mockResolvedValue({ id: 1 });

      await service.create(baseCreateDto());

      const where = prismaMock.reservation.findFirst.mock.calls[0][0].where;
      expect(where.status).toEqual({ in: ['PENDIENTE', 'CONFIRMADA'] });
      expect(where.roomId).toBe(1);
    });

    it('calcula el precio total como noches * pricePerNight', async () => {
      prismaMock.room.findUnique.mockResolvedValue(activeRoom);
      prismaMock.reservation.findFirst.mockResolvedValue(null);
      prismaMock.reservation.create.mockResolvedValue({ id: 1 });

      await service.create(baseCreateDto()); // 10→14 = 4 noches

      const data = prismaMock.reservation.create.mock.calls[0][0].data;
      expect(data.totalPrice).toBe(400);
      expect(data.status).toBe('PENDIENTE');
    });

    it('conecta o crea al cliente por email', async () => {
      prismaMock.room.findUnique.mockResolvedValue(activeRoom);
      prismaMock.reservation.findFirst.mockResolvedValue(null);
      prismaMock.reservation.create.mockResolvedValue({ id: 1 });

      await service.create(baseCreateDto());

      const data = prismaMock.reservation.create.mock.calls[0][0].data;
      expect(data.customer.connectOrCreate.where).toEqual({
        email: 'juan@example.com',
      });
      expect(data.customer.connectOrCreate.create).toMatchObject({
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@example.com',
      });
    });

    it('traduce la violación de la constraint EXCLUDE (23P01) al mensaje amigable', async () => {
      prismaMock.room.findUnique.mockResolvedValue(activeRoom);
      prismaMock.reservation.findFirst.mockResolvedValue(null);
      prismaMock.reservation.create.mockRejectedValue({ code: '23P01' });

      await expect(service.create(baseCreateDto())).rejects.toThrow(
        /ya está reservada/,
      );
    });

    it('re-lanza cualquier otro error de la base de datos', async () => {
      prismaMock.room.findUnique.mockResolvedValue(activeRoom);
      prismaMock.reservation.findFirst.mockResolvedValue(null);
      const boom = new Error('conexión perdida');
      prismaMock.reservation.create.mockRejectedValue(boom);

      await expect(service.create(baseCreateDto())).rejects.toBe(boom);
    });
  });

  describe('update', () => {
    it('lanza NotFound cuando la reserva no existe', async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(null);
      await expect(service.update(99, { status: 'CONFIRMADA' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('sólo actualiza el status sin re-chequear fechas', async () => {
      prismaMock.reservation.findUnique.mockResolvedValue({
        id: 1,
        roomId: 1,
        checkIn: new Date(inDays(10)),
        checkOut: new Date(inDays(14)),
      });
      prismaMock.reservation.update.mockResolvedValue({ id: 1 });

      await service.update(1, { status: 'CONFIRMADA' });

      expect(prismaMock.reservation.findFirst).not.toHaveBeenCalled();
      const call = prismaMock.reservation.update.mock.calls[0][0];
      expect(call.data).toEqual({ status: 'CONFIRMADA' });
      // Devuelve la reserva con room + customer para que el panel no se quede
      // con una fila "Sin cliente / Sin habitación".
      expect(call.include).toEqual({ room: true, customer: true });
    });

    it('al cambiar fechas rechaza si chocan con otra reserva (excluyéndose a sí misma)', async () => {
      prismaMock.reservation.findUnique.mockResolvedValue({
        id: 1,
        roomId: 1,
        checkIn: new Date(inDays(10)),
        checkOut: new Date(inDays(14)),
      });
      prismaMock.reservation.findFirst.mockResolvedValue({ id: 2 });

      await expect(
        service.update(1, { checkIn: inDays(11), checkOut: inDays(16) }),
      ).rejects.toThrow(/ya está reservada/);

      expect(prismaMock.reservation.findFirst.mock.calls[0][0].where.id).toEqual({
        not: 1,
      });
    });

    it('traduce la constraint EXCLUDE también en update', async () => {
      prismaMock.reservation.findUnique.mockResolvedValue({
        id: 1,
        roomId: 1,
        checkIn: new Date(inDays(10)),
        checkOut: new Date(inDays(14)),
      });
      prismaMock.reservation.findFirst.mockResolvedValue(null);
      prismaMock.reservation.update.mockRejectedValue({
        message: 'llave duplicada en reservations_no_overlap',
      });

      await expect(
        service.update(1, { checkIn: inDays(11), checkOut: inDays(16) }),
      ).rejects.toThrow(/ya está reservada/);
    });
  });

  describe('findOne', () => {
    it('lanza NotFound cuando no existe', async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(null);
      await expect(service.findOne(1)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('lanza NotFound cuando no existe', async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(null);
      await expect(service.remove(1)).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.reservation.delete).not.toHaveBeenCalled();
    });
  });

  describe('findAvailableRooms', () => {
    it('filtra habitaciones con reservas cruzadas usando "none"', async () => {
      prismaMock.room.findMany.mockResolvedValue([]);
      await service.findAvailableRooms(inDays(10), inDays(14));

      const where = prismaMock.room.findMany.mock.calls[0][0].where;
      expect(where.isActive).toBe(true);
      expect(where.reservations.none.status).toEqual({
        in: ['PENDIENTE', 'CONFIRMADA'],
      });
    });
  });
});
