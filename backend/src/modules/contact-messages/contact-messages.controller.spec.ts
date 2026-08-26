import { Test, TestingModule } from '@nestjs/testing';
import { ContactMessagesController } from './contact-messages.controller';
import { ContactMessagesService } from './contact-messages.service';
import { PrismaService } from '../../database/prisma.service';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

describe('ContactMessagesController', () => {
  let controller: ContactMessagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactMessagesController],
      providers: [
        ContactMessagesService,
        { provide: PrismaService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ContactMessagesController>(ContactMessagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
