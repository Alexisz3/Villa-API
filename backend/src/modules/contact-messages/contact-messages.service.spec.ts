import { Test, TestingModule } from '@nestjs/testing';
import { ContactMessagesService } from './contact-messages.service';
import { PrismaService } from '../../database/prisma.service';

describe('ContactMessagesService', () => {
  let service: ContactMessagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactMessagesService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<ContactMessagesService>(ContactMessagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
