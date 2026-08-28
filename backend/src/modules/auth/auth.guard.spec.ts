import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { PrismaService } from '../../database/prisma.service';

const jwtMock = { verifyAsync: jest.fn() };
const prismaMock = { user: { findUnique: jest.fn() } };

const contextWith = (cookies: Record<string, string>): ExecutionContext => {
  const req: any = { cookies };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as ExecutionContext;
};

describe('AuthGuard', () => {
  let guard: AuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new AuthGuard(jwtMock as unknown as JwtService, prismaMock as unknown as PrismaService);
  });

  it('rechaza cuando no hay cookie access_token', async () => {
    await expect(guard.canActivate(contextWith({}))).rejects.toThrow(
      'Token no proporcionado',
    );
  });

  it('rechaza cuando el token es inválido o expiró', async () => {
    jwtMock.verifyAsync.mockRejectedValue(new Error('bad signature'));
    await expect(
      guard.canActivate(contextWith({ access_token: 'x' })),
    ).rejects.toThrow(/inválido o expirado/);
  });

  it('rechaza cuando el usuario del token ya no existe', async () => {
    jwtMock.verifyAsync.mockResolvedValue({ sub: 1, email: 'a@b.com' });
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(
      guard.canActivate(contextWith({ access_token: 'x' })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza cuando la cuenta está desactivada', async () => {
    jwtMock.verifyAsync.mockResolvedValue({ sub: 1, email: 'a@b.com' });
    prismaMock.user.findUnique.mockResolvedValue({ isActive: false });
    await expect(
      guard.canActivate(contextWith({ access_token: 'x' })),
    ).rejects.toThrow(/desactivada/);
  });

  it('deja pasar y adjunta el payload a request.user cuando todo es válido', async () => {
    const payload = { sub: 42, email: 'admin@villa.com' };
    jwtMock.verifyAsync.mockResolvedValue(payload);
    prismaMock.user.findUnique.mockResolvedValue({ isActive: true });

    const req: any = { cookies: { access_token: 'good' } };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => req }),
    } as ExecutionContext;

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(req.user).toEqual(payload);
  });
});
