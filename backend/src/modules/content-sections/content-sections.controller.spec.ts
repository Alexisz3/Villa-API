import { Test, TestingModule } from '@nestjs/testing';
import { ContentSectionsController } from './content-sections.controller';
import { ContentSectionsService } from './content-sections.service';
import { MediaService } from '../media/media.service';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { assertUploadedFilesAreRealImages } from '../../common/verify-image-content';

jest.mock('../../common/verify-image-content', () => ({
  assertUploadedFilesAreRealImages: jest.fn().mockResolvedValue(undefined),
}));

const assertRealImages = assertUploadedFilesAreRealImages as jest.Mock;

const serviceMock = {
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findAll: jest.fn(),
  findByName: jest.fn(),
};

const mediaMock = {
  registerAssets: jest.fn().mockResolvedValue([]),
};

const file = (filename: string) => ({ filename }) as Express.Multer.File;

describe('ContentSectionsController', () => {
  let controller: ContentSectionsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContentSectionsController],
      providers: [
        { provide: ContentSectionsService, useValue: serviceMock },
        { provide: MediaService, useValue: mediaMock },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ContentSectionsController>(
      ContentSectionsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('maps uploaded files to /uploads paths and registers them in the library', async () => {
      serviceMock.create.mockResolvedValue({ id: 1 });
      const files = {
        banner: [file('banner-1.png')],
        images: [file('images-1.png'), file('images-2.png')],
      };

      await controller.create({ sectionName: 'home-hero-1' }, files);

      expect(assertRealImages).toHaveBeenCalled();
      expect(mediaMock.registerAssets).toHaveBeenCalledWith(
        [files.banner[0], ...files.images],
        undefined,
      );
      const dto = serviceMock.create.mock.calls[0][0];
      expect(dto.banner).toBe('/uploads/banner-1.png');
      expect(dto.images).toEqual([
        '/uploads/images-1.png',
        '/uploads/images-2.png',
      ]);
    });

    it('registers uploads under the folder hint, then drops it from the section dto', async () => {
      serviceMock.create.mockResolvedValue({ id: 1 });

      await controller.create(
        { sectionName: 'installation-cavas-banner', folder: 'cavas' },
        { banner: [file('banner-9.png')] },
      );

      expect(mediaMock.registerAssets).toHaveBeenCalledWith(
        [expect.objectContaining({ filename: 'banner-9.png' })],
        'cavas',
      );
      const dto = serviceMock.create.mock.calls[0][0];
      expect(dto.folder).toBeUndefined();
    });

    it('passes through library paths sent as body fields (no upload)', async () => {
      serviceMock.create.mockResolvedValue({ id: 1 });

      // "Elegir de la biblioteca": el frontend manda images/banner como texto,
      // sin archivos. El controlador no debe pisarlos.
      await controller.create(
        {
          sectionName: 'home-hero-1',
          banner: '/uploads/existing-banner.png',
          images: ['/uploads/existing-1.png'],
        },
        {},
      );

      expect(mediaMock.registerAssets).toHaveBeenCalledWith([], undefined);
      const dto = serviceMock.create.mock.calls[0][0];
      expect(dto.banner).toBe('/uploads/existing-banner.png');
      expect(dto.images).toEqual(['/uploads/existing-1.png']);
    });
  });

  describe('update', () => {
    it('keeps body-provided image paths when no files are uploaded', async () => {
      serviceMock.update.mockResolvedValue({ id: 3 });

      await controller.update(
        '3',
        { images: ['/uploads/from-library.png'] },
        {},
      );

      expect(serviceMock.update).toHaveBeenCalledWith(3, {
        images: ['/uploads/from-library.png'],
      });
    });
  });
});
