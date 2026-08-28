import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InstallationsService } from './installations.service';
import { PrismaService } from '../../database/prisma.service';

const prismaMock = {
  installation: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('InstallationsService', () => {
  let service: InstallationsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstallationsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get<InstallationsService>(InstallationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll (público)', () => {
    it('sólo trae instalaciones activas', async () => {
      prismaMock.installation.findMany.mockResolvedValue([]);
      await service.findAll();
      expect(prismaMock.installation.findMany.mock.calls[0][0].where).toEqual({
        isActive: true,
      });
    });
  });

  describe('findAllForAdmin', () => {
    it('trae todas sin filtrar por isActive', async () => {
      prismaMock.installation.findMany.mockResolvedValue([]);
      await service.findAllForAdmin();
      expect(
        prismaMock.installation.findMany.mock.calls[0][0].where,
      ).toBeUndefined();
    });
  });

  describe('findOne', () => {
    it('lanza NotFound cuando no existe', async () => {
      prismaMock.installation.findUnique.mockResolvedValue(null);
      await expect(service.findOne(1)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('lanza NotFound antes de actualizar', async () => {
      prismaMock.installation.findUnique.mockResolvedValue(null);
      await expect(
        service.update(1, { name: 'x' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.installation.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('lanza NotFound antes de borrar', async () => {
      prismaMock.installation.findUnique.mockResolvedValue(null);
      await expect(service.remove(1)).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.installation.delete).not.toHaveBeenCalled();
    });

    it('borra cuando existe', async () => {
      prismaMock.installation.findUnique.mockResolvedValue({ id: 1 });
      prismaMock.installation.delete.mockResolvedValue({ id: 1 });
      await service.remove(1);
      expect(prismaMock.installation.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
