import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthGuard } from './auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RequirePermissions } from './decorators/require-permissions.decorator';

const ACCESS_TOKEN_COOKIE = 'access_token';
// Debe coincidir con signOptions.expiresIn en auth.module.ts (segundos -> ms).
const ACCESS_TOKEN_MAX_AGE_MS = 3600 * 1000;

type AuthenticatedRequest = Request & { user?: { sub: number; email: string } };

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    private cookieOptions(maxAge?: number) {
        const isProduction = process.env.NODE_ENV === 'production';
        return {
            httpOnly: true,
            secure: isProduction,
            // 'lax' cubre el caso normal (frontend y API en el mismo sitio o
            // en subdominios del mismo dominio). Si algún día quedan en
            // dominios completamente distintos, esto necesita 'none' +
            // Secure + protección CSRF explícita (token de doble envío).
            sameSite: 'lax' as const,
            path: '/',
            ...(maxAge !== undefined ? { maxAge } : {}),
        };
    }

    // Solo un admin ya autenticado con permiso 'users:create' puede dar de
    // alta nuevas cuentas. Antes este endpoint estaba abierto al público:
    // cualquiera podía crear una cuenta (sin permisos, pero igual una cuenta
    // real en el sistema).
    @UseGuards(AuthGuard, PermissionsGuard)
    @RequirePermissions('users:create')
    @ApiBearerAuth()
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @Post('register')
    @ApiOperation({ summary: 'Register a new user (requires an authenticated admin)' })
    @ApiResponse({ status: 201, description: 'User successfully registered.' })
    @ApiResponse({ status: 400, description: 'Bad Request. User already exists or validation failed.' })
    register(@Body() dto: RegisterUserDto) {
        return this.authService.register(dto);
    }

    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @Post('login')
    @ApiOperation({ summary: 'Authenticate user and set the session cookie' })
    @ApiResponse({ status: 201, description: 'User successfully logged in.' })
    @ApiResponse({ status: 401, description: 'Unauthorized. Invalid credentials.' })
    async login(
        @Body() dto: LoginUserDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        // El token nunca vuelve en el body: solo vive en la cookie httpOnly,
        // así JavaScript en el navegador no puede leerlo (mitiga robo por XSS).
        const { access_token } = await this.authService.login(dto);
        res.cookie(ACCESS_TOKEN_COOKIE, access_token, this.cookieOptions(ACCESS_TOKEN_MAX_AGE_MS));
        return { success: true };
    }

    @Post('logout')
    @ApiOperation({ summary: 'Clear the session cookie' })
    logout(@Res({ passthrough: true }) res: Response) {
        // JS no puede borrar una cookie httpOnly por su cuenta; por eso el
        // logout necesita pasar por el backend.
        res.clearCookie(ACCESS_TOKEN_COOKIE, this.cookieOptions());
        return { success: true };
    }

    @UseGuards(AuthGuard)
    @ApiBearerAuth()
    @Get('me')
    @ApiOperation({ summary: 'Return the currently authenticated user' })
    me(@Req() req: AuthenticatedRequest) {
        return this.authService.me(req.user!.sub);
    }
}