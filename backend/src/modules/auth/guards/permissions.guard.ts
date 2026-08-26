import { CanActivate, ExecutionContext, ForbiddenException, Injectable, } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { PrismaService } from '../../../database/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

type AuthenticatedRequest = Request & {
    user?: {
        sub: number;
        email: string;
    };
};

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly prisma: PrismaService,
    ) { }

    async canActivate(
        context: ExecutionContext,
    ): Promise<boolean> {
        const requiredPermissions =
            this.reflector.getAllAndOverride<string[]>(
                PERMISSIONS_KEY,
                [
                    context.getHandler(),
                    context.getClass(),
                ],
            );

        if (!requiredPermissions?.length) {
            return true;
        }

        const request =
            context
                .switchToHttp()
                .getRequest<AuthenticatedRequest>();

        const userId = request.user?.sub;

        if (!userId) {
            throw new ForbiddenException(
                'Usuario no identificado',
            );
        }

        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
            include: {
                userRoles: {
                    include: {
                        role: {
                            include: {
                                rolePermissions: {
                                    include: {
                                        permission: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        const userPermissions = new Set(
            user?.userRoles.flatMap((userRole) =>
                userRole.role.rolePermissions.map(
                    (rolePermission) =>
                        rolePermission.permission.code,
                ),
            ) ?? [],
        );

        const hasPermissions =
            requiredPermissions.every((permission) =>
                userPermissions.has(permission),
            );

        if (!hasPermissions) {
            throw new ForbiddenException(
                'No tienes permisos para realizar esta acción',
            );
        }

        return true;
    }
}