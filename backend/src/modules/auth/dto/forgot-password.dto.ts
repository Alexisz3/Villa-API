import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
    @ApiProperty({ description: 'Correo de la cuenta a recuperar', example: 'admin@villaanamaria.com' })
    @IsEmail()
    email: string;
}
