import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ContentSectionsService } from './content-sections.service';
import { PrismaService } from '../../database/prisma.service';

const prismaMock = {
  contentSection: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
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

  describe('findAll / findByName', () => {
    it('nunca selecciona la columna draft (lectura pública)', async () => {
      prismaMock.contentSection.findMany.mockResolvedValue([]);
      await service.findAll();
      const arg = prismaMock.contentSection.findMany.mock.calls[0][0];
      expect(arg.select).not.toHaveProperty('draft');
      expect(arg.select.title).toBe(true);
    });

    it('findAllAdmin no restringe columnas (incluye draft)', async () => {
      prismaMock.contentSection.findMany.mockResolvedValue([]);
      await service.findAllAdmin();
      const arg = prismaMock.contentSection.findMany.mock.calls[0][0];
      expect(arg.select).toBeUndefined();
    });
  });

  describe('create', () => {
    it('sección nueva: crea la fila en blanco y manda todo al borrador', async () => {
      prismaMock.contentSection.findUnique.mockResolvedValue(null);
      prismaMock.contentSection.create.mockResolvedValue({ id: 1 });

      await service.create({ sectionName: 'home-intro', title: 'Hola' } as any);

      const arg = prismaMock.contentSection.create.mock.calls[0][0];
      expect(arg.data.sectionName).toBe('home-intro');
      expect(arg.data.images).toEqual([]);
      expect(arg.data.isActive).toBe(true);
      expect(arg.data.draft).toMatchObject({ title: 'Hola', isActive: true });
    });

    it('sección existente: mezcla sobre el borrador vigente, no toca lo publicado', async () => {
      prismaMock.contentSection.findUnique.mockResolvedValue({
        id: 1,
        title: 'Viejo',
        description: 'desc vieja',
        banner: null,
        images: ['/uploads/a.png'],
        data: null,
        isActive: true,
        draft: null,
      });
      prismaMock.contentSection.update.mockResolvedValue({ id: 1 });

      await service.create({ sectionName: 'home-intro', title: 'Nuevo' } as any);

      expect(prismaMock.contentSection.create).not.toHaveBeenCalled();
      const arg = prismaMock.contentSection.update.mock.calls[0][0];
      expect(arg.where).toEqual({ sectionName: 'home-intro' });
      // Solo cambia `title`; el resto viene del borrador vigente (== lo publicado, no había draft).
      expect(arg.data.draft).toMatchObject({
        title: 'Nuevo',
        description: 'desc vieja',
        images: ['/uploads/a.png'],
      });
      expect(arg.data).not.toHaveProperty('title'); // no toca la columna viva
    });

    it('sección existente con borrador previo: parte del borrador, no de lo publicado', async () => {
      prismaMock.contentSection.findUnique.mockResolvedValue({
        id: 1,
        title: 'Publicado',
        description: null,
        banner: null,
        images: [],
        data: null,
        isActive: true,
        draft: { title: 'Borrador a medias', description: null, banner: null, images: [], data: null, isActive: true },
      });
      prismaMock.contentSection.update.mockResolvedValue({ id: 1 });

      await service.create({ sectionName: 'home-intro', description: 'nueva desc' } as any);

      const arg = prismaMock.contentSection.update.mock.calls[0][0];
      expect(arg.data.draft.title).toBe('Borrador a medias'); // se conserva
      expect(arg.data.draft.description).toBe('nueva desc'); // se actualiza
    });

    it('persiste el contenido estructurado (data) en el borrador', async () => {
      prismaMock.contentSection.findUnique.mockResolvedValue(null);
      prismaMock.contentSection.create.mockResolvedValue({ id: 1 });
      const data = { items: [{ image: '/uploads/a.webp', name: 'Uno' }] };

      await service.create({ sectionName: 'home-personajes', data } as any);

      const arg = prismaMock.contentSection.create.mock.calls[0][0];
      expect(arg.data.draft.data).toEqual(data);
    });
  });

  describe('update', () => {
    it('throws NotFound when the section does not exist', async () => {
      prismaMock.contentSection.findUnique.mockResolvedValue(null);
      await expect(
        service.update(99, { title: 'x' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('detaches removed images WITHOUT deleting any files (sobre el borrador)', async () => {
      prismaMock.contentSection.findUnique.mockResolvedValue({
        id: 1,
        banner: null,
        images: ['/uploads/a.png', '/uploads/b.png', '/uploads/c.png'],
        draft: null,
      });
      prismaMock.contentSection.update.mockResolvedValue({ id: 1 });

      await service.update(1, {
        imagesToRemove: ['/uploads/b.png'],
      });

      const arg = prismaMock.contentSection.update.mock.calls[0][0];
      expect(arg.data.draft.images).toEqual(['/uploads/a.png', '/uploads/c.png']);
      expect(arg.data).not.toHaveProperty('images'); // no toca la columna viva
    });

    it('appends newly uploaded images to the existing order (sobre el borrador)', async () => {
      prismaMock.contentSection.findUnique.mockResolvedValue({
        id: 1,
        banner: null,
        images: ['/uploads/a.png'],
        draft: null,
      });
      prismaMock.contentSection.update.mockResolvedValue({ id: 1 });

      await service.update(1, { images: ['/uploads/d.png'] });

      const arg = prismaMock.contentSection.update.mock.calls[0][0];
      expect(arg.data.draft.images).toEqual(['/uploads/a.png', '/uploads/d.png']);
    });

    it('agregar/quitar imágenes opera sobre el borrador vigente, no sobre lo publicado', async () => {
      prismaMock.contentSection.findUnique.mockResolvedValue({
        id: 1,
        banner: null,
        images: ['/uploads/publicada.png'], // lo publicado
        draft: { title: null, description: null, banner: null, images: ['/uploads/en-borrador.png'], data: null, isActive: true },
      });
      prismaMock.contentSection.update.mockResolvedValue({ id: 1 });

      await service.update(1, { images: ['/uploads/nueva.png'] });

      const arg = prismaMock.contentSection.update.mock.calls[0][0];
      expect(arg.data.draft.images).toEqual(['/uploads/en-borrador.png', '/uploads/nueva.png']);
    });

    it('actualiza el contenido estructurado (data) sin tocar imágenes ni banner del borrador', async () => {
      prismaMock.contentSection.findUnique.mockResolvedValue({
        id: 1,
        banner: '/uploads/keep.png',
        images: ['/uploads/x.png'],
        draft: null,
      });
      prismaMock.contentSection.update.mockResolvedValue({ id: 1 });
      const structured = { items: [{ image: '/uploads/p1.webp', name: 'Uno' }] };

      await service.update(1, { data: structured } as any);

      const arg = prismaMock.contentSection.update.mock.calls[0][0].data;
      expect(arg.draft.data).toEqual(structured);
      expect(arg.draft.banner).toBe('/uploads/keep.png');
      expect(arg.draft.images).toEqual(['/uploads/x.png']);
    });

    it('clears the banner on removeBanner without touching the file', async () => {
      prismaMock.contentSection.findUnique.mockResolvedValue({
        id: 1,
        banner: '/uploads/old.png',
        images: [],
        draft: null,
      });
      prismaMock.contentSection.update.mockResolvedValue({ id: 1 });

      await service.update(1, { removeBanner: true });

      const arg = prismaMock.contentSection.update.mock.calls[0][0].data;
      expect(arg.draft.banner).toBeNull();
    });

    it('replaces the banner with the new path', async () => {
      prismaMock.contentSection.findUnique.mockResolvedValue({
        id: 1,
        banner: '/uploads/old.png',
        images: [],
        draft: null,
      });
      prismaMock.contentSection.update.mockResolvedValue({ id: 1 });

      await service.update(1, { banner: '/uploads/new.png' });

      const arg = prismaMock.contentSection.update.mock.calls[0][0].data;
      expect(arg.draft.banner).toBe('/uploads/new.png');
    });
  });

  describe('reorderImages', () => {
    const existing = {
      id: 1,
      banner: null,
      images: ['/uploads/a.png', '/uploads/b.png', '/uploads/c.png'],
      draft: null,
    };

    it('acepta una permutación válida y la guarda en el borrador', async () => {
      prismaMock.contentSection.findUnique.mockResolvedValue(existing);
      prismaMock.contentSection.update.mockResolvedValue({ id: 1 });

      await service.reorderImages(1, ['/uploads/c.png', '/uploads/a.png', '/uploads/b.png']);

      const arg = prismaMock.contentSection.update.mock.calls[0][0].data;
      expect(arg.draft.images).toEqual(['/uploads/c.png', '/uploads/a.png', '/uploads/b.png']);
    });

    it('rechaza si falta o sobra una imagen', async () => {
      prismaMock.contentSection.findUnique.mockResolvedValue(existing);

      await expect(
        service.reorderImages(1, ['/uploads/a.png', '/uploads/b.png']),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prismaMock.contentSection.update).not.toHaveBeenCalled();
    });

    it('throws NotFound cuando la sección no existe', async () => {
      prismaMock.contentSection.findUnique.mockResolvedValue(null);
      await expect(service.reorderImages(99, [])).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('publish', () => {
    it('copia el borrador a las columnas vivas y lo limpia', async () => {
      prismaMock.contentSection.findUnique.mockResolvedValue({
        id: 1,
        draft: {
          title: 'Título nuevo',
          description: 'desc nueva',
          banner: '/uploads/nuevo.png',
          images: ['/uploads/x.png'],
          data: { items: [] },
          isActive: false,
        },
      });
      prismaMock.contentSection.update.mockResolvedValue({ id: 1 });

      await service.publish(1);

      const arg = prismaMock.contentSection.update.mock.calls[0][0].data;
      expect(arg.title).toBe('Título nuevo');
      expect(arg.description).toBe('desc nueva');
      expect(arg.banner).toBe('/uploads/nuevo.png');
      expect(arg.images).toEqual(['/uploads/x.png']);
      expect(arg.data).toEqual({ items: [] });
      expect(arg.isActive).toBe(false);
      expect(arg.draft).toBeDefined(); // Prisma.DbNull, limpia el borrador
    });

    it('rechaza publicar cuando no hay borrador pendiente', async () => {
      prismaMock.contentSection.findUnique.mockResolvedValue({ id: 1, draft: null });
      await expect(service.publish(1)).rejects.toBeInstanceOf(BadRequestException);
      expect(prismaMock.contentSection.update).not.toHaveBeenCalled();
    });

    it('throws NotFound cuando la sección no existe', async () => {
      prismaMock.contentSection.findUnique.mockResolvedValue(null);
      await expect(service.publish(99)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('discardDraft', () => {
    it('limpia el borrador sin tocar lo publicado', async () => {
      prismaMock.contentSection.findUnique.mockResolvedValue({ id: 1, draft: { title: 'x' } });
      prismaMock.contentSection.update.mockResolvedValue({ id: 1 });

      await service.discardDraft(1);

      expect(prismaMock.contentSection.update.mock.calls[0][0].where).toEqual({ id: 1 });
      expect(prismaMock.contentSection.update.mock.calls[0][0].data).toHaveProperty('draft');
      // Solo toca `draft`, ningún otro campo.
      expect(Object.keys(prismaMock.contentSection.update.mock.calls[0][0].data)).toEqual(['draft']);
    });

    it('throws NotFound cuando la sección no existe', async () => {
      prismaMock.contentSection.findUnique.mockResolvedValue(null);
      await expect(service.discardDraft(99)).rejects.toBeInstanceOf(NotFoundException);
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
