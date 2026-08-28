import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsMaintenanceService } from './reservations-maintenance.service';
import { PrismaService } from '../../database/prisma.service';

const prismaMock = {
  reservation: { updateMany: jest.fn() },
  $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
};

describe('ReservationsMaintenanceService', () => {
  let service: ReservationsMaintenanceService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsMaintenanceService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get(ReservationsMaintenanceService);
  });

  it('cierra CONFIRMADA vencidas y cancela PENDIENTE vencidas, en una transacción', async () => {
    prismaMock.reservation.updateMany
      .mockResolvedValueOnce({ count: 2 }) // completadas
      .mockResolvedValueOnce({ count: 1 }); // vencidas

    const result = await service.run(new Date('2026-03-15T09:00:00.000Z'));

    expect(result).toEqual({ completed: 2, expired: 1 });
    expect(prismaMock.$transaction).toHaveBeenCalled();

    const [completeArgs, expireArgs] =
      prismaMock.reservation.updateMany.mock.calls.map((c) => c[0]);

    expect(completeArgs).toEqual({
      where: { status: 'CONFIRMADA', checkOut: { lte: new Date('2026-03-15T00:00:00.000Z') } },
      data: { status: 'COMPLETADA' },
    });
    expect(expireArgs).toEqual({
      where: { status: 'PENDIENTE', checkIn: { lt: new Date('2026-03-15T00:00:00.000Z') } },
      data: { status: 'CANCELADA' },
    });
  });

  it('onModuleInit no arranca timers en entorno de test', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    const spy = jest.spyOn(global, 'setInterval');
    service.onModuleInit();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
    process.env.NODE_ENV = original;
  });
});
