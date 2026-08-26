import { Test, TestingModule } from '@nestjs/testing';
import { InstallationsService } from './installations.service';
import { PrismaService } from '../../database/prisma.service';

describe('InstallationsService', () => {
  let service: InstallationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstallationsService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<InstallationsService>(InstallationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
