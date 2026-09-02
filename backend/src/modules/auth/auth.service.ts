import {
    Injectable,
    ConflictException,
    UnauthorizedException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { Prisma } from '../../generated/prisma/client';
import { JwtService } from '@nestjs/jwt';

// El enlace de recuperación vale 1 hora.
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
        private readonly mail: MailService,
    ) { }

    private hashToken(rawToken: string): string {
        return crypto.createHash('sha256').update(rawToken).digest('hex');
    }

    async login(dto: LoginUserDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);

        if (!passwordMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Esta cuenta está desactivada.');
        }

        const payload = {
            sub: user.id,
            email: user.email,
        };

        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }

    async me(userId: number) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true },
        });

        if (!user) {
            throw new UnauthorizedException('Usuario no encontrado');
        }

        return user;
    }

    async register(dto: RegisterUserDto) {
        const passwordHash = await bcrypt.hash(dto.password, 10);

        try {
            const user = await this.prisma.user.create({
                data: {
                    name: dto.name,
                    email: dto.email,
                    passwordHash,
                },
            });

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                isActive: user.isActive,
                createdAt: user.createdAt,
            };
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ConflictException('Email already registered');
                }
            }
            throw error;
        }
    }

    // "Olvidé mi contraseña": genera un token, lo manda por correo y NUNCA
    // revela si el email existe o no (responde igual en todos los casos).
    async forgotPassword(email: string): Promise<void> {
        const user = await this.prisma.user.findUnique({ where: { email } });

        if (!user || !user.isActive) {
            return;
        }

        // Un solo enlace vivo por usuario: invalida los pedidos anteriores.
        await this.prisma.passwordResetToken.updateMany({
            where: { userId: user.id, usedAt: null },
            data: { usedAt: new Date() },
        });

        const rawToken = crypto.randomBytes(32).toString('hex');
        await this.prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                tokenHash: this.hashToken(rawToken),
                expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
            },
        });

        const base = (
            this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173'
        ).replace(/\/$/, '');
        const resetUrl = `${base}/admin/restablecer?token=${rawToken}`;

        await this.mail.sendPasswordReset(user.email, resetUrl);
        this.logger.log(`Enlace de recuperación emitido para el usuario ${user.id}.`);
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        const record = await this.prisma.passwordResetToken.findUnique({
            where: { tokenHash: this.hashToken(token) },
        });

        if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
            throw new BadRequestException(
                'El enlace de recuperación no es válido o ya expiró. Solicita uno nuevo.',
            );
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: record.userId },
                data: { passwordHash },
            }),
            // Marca este token y cualquier otro pendiente del mismo usuario.
            this.prisma.passwordResetToken.updateMany({
                where: { userId: record.userId, usedAt: null },
                data: { usedAt: new Date() },
            }),
        ]);

        this.logger.log(`Contraseña restablecida para el usuario ${record.userId}.`);
    }
}
