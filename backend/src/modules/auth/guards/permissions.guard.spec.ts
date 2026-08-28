import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { PrismaService } from '../../../database/prisma.service';

const prismaMock = { user: { findUnique: jest.fn() } };

const makeContext = (user?: { sub: number; email: string }): ExecutionContext => {
  const req: any = { user };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as ExecutionContext;
};

// Un usuario Prisma con el set de permisos dado, en la forma anidada que
// espera el guard (userRoles -> role -> rolePermissions -> permission.code).
const userWithPermissions = (codes: string[]) => ({
  userRoles: [
    {
      role: {
        rolePermissions: codes.map((code) => ({ permission: { code } })),
      },
    },
  ],
});

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    jest.clearAllMocks();
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector, prismaMock as unknown as PrismaService);
  });

  it('deja pasar rutas sin @RequirePermissions', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    await expect(guard.canActivate(makeContext())).resolves.toBe(true);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('rechaza (403) cuando no hay usuario identificado en la request', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['media:read']);
    await expect(guard.canActivate(makeContext(undefined))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rechaza (403) cuando al rol le falta alguno de los permisos requeridos', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['media:read', 'media:delete']);
    prismaMock.user.findUnique.mockResolvedValue(
      userWithPermissions(['media:read']),
    );

    await expect(
      guard.canActivate(makeContext({ sub: 1, email: 'a@b.com' })),
    ).rejects.toThrow(/No tienes permisos/);
  });

  it('deja pasar cuando el rol tiene todos los permisos requeridos', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['media:read', 'media:delete']);
    prismaMock.user.findUnique.mockResolvedValue(
      userWithPermissions(['media:read', 'media:delete', 'media:update']),
    );

    await expect(
      guard.canActivate(makeContext({ sub: 1, email: 'a@b.com' })),
    ).resolves.toBe(true);
  });

  it('agrega permisos de varios roles del usuario', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['rooms:update']);
    prismaMock.user.findUnique.mockResolvedValue({
      userRoles: [
        { role: { rolePermissions: [{ permission: { code: 'media:read' } }] } },
        { role: { rolePermissions: [{ permission: { code: 'rooms:update' } }] } },
      ],
    });

    await expect(
      guard.canActivate(makeContext({ sub: 1, email: 'a@b.com' })),
    ).resolves.toBe(true);
  });
});
