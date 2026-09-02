import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../mail/mail.service';
import { Prisma } from '../../generated/prisma/client';

jest.mock('bcrypt');

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  passwordResetToken: {
    findUnique: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
};

const jwtMock = {
  signAsync: jest.fn(),
};

const configMock = {
  get: jest.fn((key: string) =>
    key === 'FRONTEND_URL' ? 'https://panel.villaanamaria.com' : undefined,
  ),
};

const mailMock = {
  sendPasswordReset: jest.fn(),
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
        { provide: ConfigService, useValue: configMock },
        { provide: MailService, useValue: mailMock },
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

  describe('forgotPassword', () => {
    it('no hace nada (ni token ni correo) si el email no existe', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await service.forgotPassword('nadie@villa.com');

      expect(prismaMock.passwordResetToken.create).not.toHaveBeenCalled();
      expect(mailMock.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('no hace nada si la cuenta está desactivada', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'admin@villa.com',
        isActive: false,
      });

      await service.forgotPassword('admin@villa.com');

      expect(prismaMock.passwordResetToken.create).not.toHaveBeenCalled();
      expect(mailMock.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('crea un token hasheado, invalida los previos y manda el correo con el enlace', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 7,
        email: 'admin@villa.com',
        isActive: true,
      });

      await service.forgotPassword('admin@villa.com');

      // Invalida pedidos anteriores del mismo usuario.
      expect(prismaMock.passwordResetToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 7, usedAt: null },
        data: { usedAt: expect.any(Date) },
      });

      const created = prismaMock.passwordResetToken.create.mock.calls[0][0].data;
      expect(created.userId).toBe(7);
      // Nunca se guarda el token en claro: 64 hex = SHA-256.
      expect(created.tokenHash).toMatch(/^[a-f0-9]{64}$/);
      expect(created.expiresAt.getTime()).toBeGreaterThan(Date.now());

      const [to, url] = mailMock.sendPasswordReset.mock.calls[0];
      expect(to).toBe('admin@villa.com');
      expect(url).toMatch(
        /^https:\/\/panel\.villaanamaria\.com\/admin\/restablecer\?token=[a-f0-9]{64}$/,
      );
      // El enlace lleva el token en claro, distinto del hash guardado.
      expect(url).not.toContain(created.tokenHash);
    });
  });

  describe('resetPassword', () => {
    it('rechaza un token inexistente', async () => {
      prismaMock.passwordResetToken.findUnique.mockResolvedValue(null);
      await expect(service.resetPassword('x'.repeat(64), 'nueva-clave')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rechaza un token ya usado', async () => {
      prismaMock.passwordResetToken.findUnique.mockResolvedValue({
        id: 1,
        userId: 7,
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 1000),
      });
      await expect(service.resetPassword('x'.repeat(64), 'nueva-clave')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rechaza un token expirado', async () => {
      prismaMock.passwordResetToken.findUnique.mockResolvedValue({
        id: 1,
        userId: 7,
        usedAt: null,
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.resetPassword('x'.repeat(64), 'nueva-clave')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('con un token válido: hashea la nueva contraseña y quema los tokens del usuario', async () => {
      prismaMock.passwordResetToken.findUnique.mockResolvedValue({
        id: 3,
        userId: 7,
        usedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });
      bcryptHash.mockResolvedValue('nuevo-hash');

      await service.resetPassword('a'.repeat(64), 'mi-nueva-clave');

      expect(bcryptHash).toHaveBeenCalledWith('mi-nueva-clave', 10);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 7 },
        data: { passwordHash: 'nuevo-hash' },
      });
      expect(prismaMock.passwordResetToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 7, usedAt: null },
        data: { usedAt: expect.any(Date) },
      });
    });
  });
});
