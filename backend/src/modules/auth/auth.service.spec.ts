import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '../../generated/prisma/client';

jest.mock('bcrypt');

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const jwtMock = {
  signAsync: jest.fn(),
};

const bcryptCompare = bcrypt.compare as jest.Mock;
const bcryptHash = bcrypt.hash as jest.Mock;

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    const dto = { email: 'admin@villa.com', password: 'secret123' };

    it('rechaza cuando el email no existe', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(service.login(dto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(bcryptCompare).not.toHaveBeenCalled();
    });

    it('rechaza cuando la contraseña no coincide', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        passwordHash: 'hash',
        isActive: true,
      });
      bcryptCompare.mockResolvedValue(false);
      await expect(service.login(dto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rechaza cuando la cuenta está desactivada', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        passwordHash: 'hash',
        isActive: false,
      });
      bcryptCompare.mockResolvedValue(true);
      await expect(service.login(dto)).rejects.toThrow(/desactivada/);
    });

    it('devuelve un access_token firmado con sub + email en el payload', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 7,
        email: 'admin@villa.com',
        passwordHash: 'hash',
        isActive: true,
      });
      bcryptCompare.mockResolvedValue(true);
      jwtMock.signAsync.mockResolvedValue('jwt-token');

      const result = await service.login(dto);

      expect(result).toEqual({ access_token: 'jwt-token' });
      expect(jwtMock.signAsync).toHaveBeenCalledWith({
        sub: 7,
        email: 'admin@villa.com',
      });
    });
  });

  describe('me', () => {
    it('lanza Unauthorized cuando el usuario no existe', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(service.me(1)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('devuelve id, name y email', async () => {
      const user = { id: 1, name: 'Admin', email: 'a@b.com' };
      prismaMock.user.findUnique.mockResolvedValue(user);
      await expect(service.me(1)).resolves.toEqual(user);
    });
  });

  describe('register', () => {
    const dto = { name: 'Nuevo', email: 'nuevo@villa.com', password: 'secret123' };

    it('hashea la contraseña con bcrypt antes de guardar', async () => {
      bcryptHash.mockResolvedValue('hashed');
      prismaMock.user.create.mockResolvedValue({
        id: 2,
        name: dto.name,
        email: dto.email,
        isActive: true,
        createdAt: new Date(),
      });

      await service.register(dto);

      expect(bcryptHash).toHaveBeenCalledWith('secret123', 10);
      expect(prismaMock.user.create.mock.calls[0][0].data.passwordHash).toBe(
        'hashed',
      );
    });

    it('nunca devuelve el passwordHash', async () => {
      bcryptHash.mockResolvedValue('hashed');
      prismaMock.user.create.mockResolvedValue({
        id: 2,
        name: dto.name,
        email: dto.email,
        passwordHash: 'hashed',
        isActive: true,
        createdAt: new Date(),
      });

      const result = await service.register(dto);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('convierte el P2002 de Prisma en 409 ConflictException', async () => {
      bcryptHash.mockResolvedValue('hashed');
      prismaMock.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', {
          code: 'P2002',
          clientVersion: 'x',
        }),
      );

      await expect(service.register(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('re-lanza otros errores', async () => {
      bcryptHash.mockResolvedValue('hashed');
      const boom = new Error('db down');
      prismaMock.user.create.mockRejectedValue(boom);
      await expect(service.register(dto)).rejects.toBe(boom);
    });
  });
});
