import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
    @ApiProperty({ description: 'Token recibido por correo', example: 'a1b2c3...' })
    @IsString()
    @MinLength(10)
    @MaxLength(200)
    token: string;

    @ApiProperty({ description: 'Nueva contraseña', minLength: 8, maxLength: 100 })
    @IsString()
    @MinLength(8)
    @MaxLength(100)
    password: string;
}
