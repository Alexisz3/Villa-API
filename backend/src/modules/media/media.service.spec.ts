import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { MediaService, deriveAltText } from './media.service';
import { PrismaService } from '../../database/prisma.service';

describe('deriveAltText', () => {
  it('humaniza un nombre real', () => {
    expect(deriveAltText('Cavas1.webp', 'cavas')).toBe('Cavas 1');
    expect(deriveAltText('cms-galseco-SecoCarne.webp', 'santo-seco')).toBe('Seco Carne');
  });

  it('cae en la etiqueta de la carpeta para nombres autogenerados', () => {
    expect(deriveAltText('banner-1787593762630-877362732.webp', 'pizzeria')).toBe('Pizzería');
    expect(deriveAltText('images-1787593952214-745110599.webp', 'zona-pet')).toBe('Zona Pet');
  });
});

const prismaMock = {
  mediaAsset: {
    upsert: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  contentSection: { findMany: jest.fn() },
  room: { findMany: jest.fn() },
  $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
};

describe('MediaService', () => {
  let service: MediaService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get<MediaService>(MediaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerAssets', () => {
    it('returns [] and touches nothing for an empty list', async () => {
      const result = await service.registerAssets([]);
      expect(result).toEqual([]);
      expect(prismaMock.mediaAsset.upsert).not.toHaveBeenCalled();
    });

    it('upserts by path and never overwrites an existing asset', async () => {
      prismaMock.mediaAsset.upsert.mockResolvedValue({ id: 1 });
      const file = {
        filename: 'media-1.png',
        originalname: 'foto.png',
        mimetype: 'image/png',
        size: 1234,
        path: '/does/not/exist.png',
      } as Express.Multer.File;

      await service.registerAssets([file]);

      expect(prismaMock.mediaAsset.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { path: '/uploads/media-1.png' },
          update: {},
          create: expect.objectContaining({
            path: '/uploads/media-1.png',
            originalName: 'foto.png',
            mimeType: 'image/png',
            sizeBytes: 1234,
            width: null,
            height: null,
          }),
        }),
      );
    });

    it('tags new assets with the given folder', async () => {
      prismaMock.mediaAsset.upsert.mockResolvedValue({ id: 1 });
      const file = {
        filename: 'media-1.png',
        originalname: 'foto.png',
        mimetype: 'image/png',
        size: 1,
        path: '/x.png',
      } as Express.Multer.File;

      await service.registerAssets([file], '  cavas  ');

      const arg = prismaMock.mediaAsset.upsert.mock.calls[0][0];
      expect(arg.create.folder).toBe('cavas');
    });

    it('leaves folder unset when none is given', async () => {
      prismaMock.mediaAsset.upsert.mockResolvedValue({ id: 1 });
      const file = {
        filename: 'm.png',
        originalname: 'm.png',
        mimetype: 'image/png',
        size: 1,
        path: '/y.png',
      } as Express.Multer.File;

      await service.registerAssets([file]);

      const arg = prismaMock.mediaAsset.upsert.mock.calls[0][0];
      expect(arg.create.folder).toBeUndefined();
    });
  });

  describe('listFolders', () => {
    it('returns distinct non-trashed folder names', async () => {
      prismaMock.mediaAsset.findMany.mockResolvedValue([
        { folder: 'cavas' },
        { folder: 'general' },
      ]);

      const result = await service.listFolders();

      expect(result).toEqual(['cavas', 'general']);
      const arg = prismaMock.mediaAsset.findMany.mock.calls[0][0];
      expect(arg.where.deletedAt).toBeNull();
      expect(arg.distinct).toEqual(['folder']);
    });
  });

  describe('assignFolders', () => {
    it('agrupa por carpeta destino y hace un updateMany por grupo', async () => {
      prismaMock.mediaAsset.updateMany
        .mockResolvedValueOnce({ count: 2 })
        .mockResolvedValueOnce({ count: 1 });

      const result = await service.assignFolders([
        { id: 1, folder: 'cavas' },
        { id: 2, folder: 'cavas' },
        { id: 3, folder: 'inicio' },
      ]);

      expect(result).toEqual({ updated: 3 });
      expect(prismaMock.mediaAsset.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2] } },
        data: { folder: 'cavas' },
      });
      expect(prismaMock.mediaAsset.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [3] } },
        data: { folder: 'inicio' },
      });
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('normaliza carpeta vacia a "general"', async () => {
      prismaMock.mediaAsset.updateMany.mockResolvedValue({ count: 1 });

      await service.assignFolders([{ id: 9, folder: '  ' }]);

      expect(prismaMock.mediaAsset.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [9] } },
        data: { folder: 'general' },
      });
    });
  });

  describe('list', () => {
    it('filters out trashed assets by default', async () => {
      prismaMock.mediaAsset.findMany.mockResolvedValue([]);
      prismaMock.mediaAsset.count.mockResolvedValue(0);

      await service.list({});

      const arg = prismaMock.mediaAsset.findMany.mock.calls[0][0];
      expect(arg.where.deletedAt).toBeNull();
    });

    it('shows only trashed assets when trashed=true', async () => {
      prismaMock.mediaAsset.findMany.mockResolvedValue([]);
      prismaMock.mediaAsset.count.mockResolvedValue(0);

      await service.list({ trashed: 'true' });

      const arg = prismaMock.mediaAsset.findMany.mock.calls[0][0];
      expect(arg.where.deletedAt).toEqual({ not: null });
    });

    it('caps pageSize at 500', async () => {
      prismaMock.mediaAsset.findMany.mockResolvedValue([]);
      prismaMock.mediaAsset.count.mockResolvedValue(0);

      const result = await service.list({ pageSize: 5000 });

      expect(result.pageSize).toBe(500);
      expect(prismaMock.mediaAsset.findMany.mock.calls[0][0].take).toBe(500);
    });
  });

  describe('softDelete', () => {
    it('throws NotFound when the asset does not exist', async () => {
      prismaMock.mediaAsset.findUnique.mockResolvedValue(null);
      await expect(service.softDelete(9)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('refuses with 409 when the asset is referenced by a section', async () => {
      prismaMock.mediaAsset.findUnique.mockResolvedValue({
        id: 1,
        path: '/uploads/x.png',
        deletedAt: null,
      });
      prismaMock.contentSection.findMany.mockResolvedValue([
        { sectionName: 'home-hero-1' },
      ]);
      prismaMock.room.findMany.mockResolvedValue([]);

      await expect(service.softDelete(1)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prismaMock.mediaAsset.update).not.toHaveBeenCalled();
    });

    it('sets deletedAt when the asset is not referenced anywhere', async () => {
      prismaMock.mediaAsset.findUnique.mockResolvedValue({
        id: 1,
        path: '/uploads/x.png',
        deletedAt: null,
      });
      prismaMock.contentSection.findMany.mockResolvedValue([]);
      prismaMock.room.findMany.mockResolvedValue([]);
      prismaMock.mediaAsset.update.mockResolvedValue({ id: 1 });

      await service.softDelete(1);

      expect(prismaMock.mediaAsset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { deletedAt: expect.any(Date) },
        }),
      );
    });

    it('is a no-op when the asset is already trashed', async () => {
      prismaMock.mediaAsset.findUnique.mockResolvedValue({
        id: 1,
        path: '/uploads/x.png',
        deletedAt: new Date(),
      });

      await service.softDelete(1);

      expect(prismaMock.contentSection.findMany).not.toHaveBeenCalled();
      expect(prismaMock.mediaAsset.update).not.toHaveBeenCalled();
    });
  });

  describe('restore', () => {
    it('clears deletedAt', async () => {
      prismaMock.mediaAsset.findUnique.mockResolvedValue({ id: 1 });
      prismaMock.mediaAsset.update.mockResolvedValue({ id: 1 });

      await service.restore(1);

      expect(prismaMock.mediaAsset.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deletedAt: null },
      });
    });
  });

  describe('findReferences', () => {
    it('matches a path used as a banner or inside the images array', async () => {
      prismaMock.contentSection.findMany.mockResolvedValue([
        { sectionName: 'a' },
      ]);
      prismaMock.room.findMany.mockResolvedValue([
        { id: 3, name: 'La Abuela' },
      ]);

      const refs = await service.findReferences('/uploads/x.png');

      expect(prismaMock.contentSection.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { banner: '/uploads/x.png' },
            { images: { has: '/uploads/x.png' } },
          ],
        },
        select: { sectionName: true },
      });
      expect(refs.rooms).toHaveLength(1);
    });
  });
});
