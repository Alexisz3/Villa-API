import { Test, TestingModule } from '@nestjs/testing';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { assertUploadedFilesAreRealImages } from '../../common/verify-image-content';

jest.mock('../../common/verify-image-content', () => ({
  assertUploadedFilesAreRealImages: jest.fn().mockResolvedValue(undefined),
}));

const assertRealImages = assertUploadedFilesAreRealImages as jest.Mock;

const serviceMock = {
  list: jest.fn(),
  listFolders: jest.fn(),
  registerAssets: jest.fn(),
  updateMeta: jest.fn(),
  restore: jest.fn(),
  softDelete: jest.fn(),
};

describe('MediaController', () => {
  let controller: MediaController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [{ provide: MediaService, useValue: serviceMock }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MediaController>(MediaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('upload', () => {
    it('validates the files, then registers them with the given folder', async () => {
      const files = [{ filename: 'media-1.png' }] as Express.Multer.File[];
      serviceMock.registerAssets.mockResolvedValue([{ id: 1 }]);

      await controller.upload(files, { folder: 'cavas' });

      expect(assertRealImages).toHaveBeenCalledWith(files);
      expect(serviceMock.registerAssets).toHaveBeenCalledWith(files, 'cavas');
    });

    it('tolerates an undefined files array', async () => {
      serviceMock.registerAssets.mockResolvedValue([]);
      await controller.upload(
        undefined as unknown as Express.Multer.File[],
        {},
      );
      expect(assertRealImages).toHaveBeenCalledWith([]);
      expect(serviceMock.registerAssets).toHaveBeenCalledWith([], undefined);
    });
  });

  describe('remove', () => {
    it('delegates to softDelete (logical delete)', async () => {
      serviceMock.softDelete.mockResolvedValue({ id: 5 });
      await controller.remove(5);
      expect(serviceMock.softDelete).toHaveBeenCalledWith(5);
    });
  });
});
