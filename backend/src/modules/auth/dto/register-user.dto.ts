import {
    IsEmail,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
    @ApiProperty({ description: 'Full name of the user', example: 'Juan Pérez', minLength: 2, maxLength: 100 })
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name: string;

    @ApiProperty({ description: 'Email address of the user', example: 'juan.perez@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'Password for the account', example: 'securepassword123', minLength: 8, maxLength: 100 })
    @IsString()
    @MinLength(8)
    @MaxLength(100)
    password: string;
}