import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ContentSectionsService } from './content-sections.service';
import { PrismaService } from '../../database/prisma.service';

const prismaMock = {
  contentSection: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('ContentSectionsService', () => {
  let service: ContentSectionsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentSectionsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get<ContentSectionsService>(ContentSectionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('upserts by sectionName with sane defaults', async () => {
      prismaMock.contentSection.upsert.mockResolvedValue({ id: 1 });

      await service.create({ sectionName: 'home-intro' });

      const arg = prismaMock.contentSection.upsert.mock.calls[0][0];
      expect(arg.where).toEqual({ sectionName: 'home-intro' });
      expect(arg.create.images).toEqual([]);
      expect(arg.create.isActive).toBe(true);
    });
  });

  describe('update', () => {
    it('throws NotFound when the section does not exist', async () => {
      prismaMock.contentSection.findUnique.mockResolvedValue(null);
      await expect(
        service.update(99, { title: 'x' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('detaches removed images WITHOUT deleting any files', async () => {
      prismaMock.contentSection.findUnique.mockResolvedValue({
        id: 1,
        banner: null,
        images: ['/uploads/a.png', '/uploads/b.png', '/uploads/c.png'],
      });
      prismaMock.contentSection.update.mockResolvedValue({ id: 1 });

      await service.update(1, {
        imagesToRemove: ['/uploads/b.png'],
      });

      const data = prismaMock.contentSection.update.mock.calls[0][0].data;
      expect(data.images).toEqual(['/uploads/a.png', '/uploads/c.png']);
      // No fs access at all — the service no longer imports fs/promises.
    });

    it('appends newly uploaded images to the existing order', async () => {
      prismaMock.contentSection.findUnique.mockResolvedValue({
        id: 1,
        banner: null,
        images: ['/uploads/a.png'],
      });
      prismaMock.contentSection.update.mockResolvedValue({ id: 1 });

      await service.update(1, { images: ['/uploads/d.png'] });

      const data = prismaMock.contentSection.update.mock.calls[0][0].data;
      expect(data.images).toEqual(['/uploads/a.png', '/uploads/d.png']);
    });

    it('clears the banner on removeBanner without touching the file', async () => {
      prismaMock.contentSection.findUnique.mockResolvedValue({
        id: 1,
        banner: '/uploads/old.png',
        images: [],
      });
      prismaMock.contentSection.update.mockResolvedValue({ id: 1 });

      await service.update(1, { removeBanner: true });

      const data = prismaMock.contentSection.update.mock.calls[0][0].data;
      expect(data.banner).toBeNull();
    });

    it('replaces the banner with the new path', async () => {
      prismaMock.contentSection.findUnique.mockResolvedValue({
        id: 1,
        banner: '/uploads/old.png',
        images: [],
      });
      prismaMock.contentSection.update.mockResolvedValue({ id: 1 });

      await service.update(1, { banner: '/uploads/new.png' });

      const data = prismaMock.contentSection.update.mock.calls[0][0].data;
      expect(data.banner).toBe('/uploads/new.png');
    });
  });

  describe('remove', () => {
    it('throws NotFound when the section does not exist', async () => {
      prismaMock.contentSection.findUnique.mockResolvedValue(null);
      await expect(service.remove(99)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('deletes only the row, never the referenced files', async () => {
      prismaMock.contentSection.findUnique.mockResolvedValue({
        id: 1,
        banner: '/uploads/keep.png',
        images: ['/uploads/keep2.png'],
      });
      prismaMock.contentSection.delete.mockResolvedValue({ id: 1 });

      await service.remove(1);

      expect(prismaMock.contentSection.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
