import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ContactMessagesService } from './contact-messages.service';
import { PrismaService } from '../../database/prisma.service';

const prismaMock = {
  contactMessage: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('ContactMessagesService', () => {
  let service: ContactMessagesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactMessagesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get<ContactMessagesService>(ContactMessagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('persiste los datos del contacto y descarta campos ajenos (status)', async () => {
      prismaMock.contactMessage.create.mockResolvedValue({ id: 1 });
      await service.create({
        name: 'Ana',
        email: 'ana@x.com',
        phone: '099',
        subject: 'consulta',
        message: 'Hola',
        channel: 'whatsapp',
        status: 'confirmado',
      } as any);

      expect(prismaMock.contactMessage.create).toHaveBeenCalledWith({
        data: {
          name: 'Ana',
          email: 'ana@x.com',
          phone: '099',
          subject: 'consulta',
          message: 'Hola',
          channel: 'whatsapp',
        },
      });
    });

    it('deja que la BD ponga el canal por defecto cuando no se especifica', async () => {
      prismaMock.contactMessage.create.mockResolvedValue({ id: 1 });
      await service.create({
        name: 'Ana',
        email: 'ana@x.com',
        message: 'Hola',
      } as any);

      const data = prismaMock.contactMessage.create.mock.calls[0][0].data;
      expect(data).not.toHaveProperty('channel');
    });
  });

  describe('findAll', () => {
    it('ordena por createdAt descendente', async () => {
      prismaMock.contactMessage.findMany.mockResolvedValue([]);
      await service.findAll();
      expect(prismaMock.contactMessage.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('lanza NotFound cuando no existe', async () => {
      prismaMock.contactMessage.findUnique.mockResolvedValue(null);
      await expect(service.findOne(1)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('lanza NotFound antes de actualizar', async () => {
      prismaMock.contactMessage.findUnique.mockResolvedValue(null);
      await expect(service.updateStatus(1, 'leido')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prismaMock.contactMessage.update).not.toHaveBeenCalled();
    });

    it('actualiza sólo el status cuando el mensaje existe', async () => {
      prismaMock.contactMessage.findUnique.mockResolvedValue({ id: 1 });
      prismaMock.contactMessage.update.mockResolvedValue({ id: 1 });
      await service.updateStatus(1, 'leido');
      expect(prismaMock.contactMessage.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'leido' },
      });
    });
  });
});
