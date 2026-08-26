import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';


type AuthenticatedRequest = Request & {
    user?: {
        sub: number;
        email: string;
    };
};

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request =
            context.switchToHttp().getRequest<AuthenticatedRequest>();

        const token = request.cookies?.['access_token'];

        if (!token) {
            throw new UnauthorizedException(
                'Token no proporcionado',
            );
        }

        let payload: { sub: number; email: string };
        try {
            payload = await this.jwtService.verifyAsync<{
                sub: number;
                email: string;
            }>(token);
        } catch {
            throw new UnauthorizedException(
                'Token inválido o expirado',
            );
        }

        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { isActive: true },
        });

        if (!user || !user.isActive) {
            throw new UnauthorizedException(
                'Esta cuenta está desactivada.',
            );
        }

        request.user = payload;

        return true;
    }
}