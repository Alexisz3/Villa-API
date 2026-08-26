import { Test, TestingModule } from '@nestjs/testing';
import { InstallationsController } from './installations.controller';
import { InstallationsService } from './installations.service';
import { PrismaService } from '../../database/prisma.service';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

describe('InstallationsController', () => {
  let controller: InstallationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InstallationsController],
      providers: [
        InstallationsService,
        { provide: PrismaService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<InstallationsController>(InstallationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
