import {
    IsEmail,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContactMessageDto {
    @ApiProperty({ description: 'Name of the sender', example: 'Ana Lopez', minLength: 2, maxLength: 100 })
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name: string;

    @ApiProperty({ description: 'Email address of the sender', example: 'ana.lopez@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'Phone number of the sender', example: '+1234567890', required: false, maxLength: 30 })
    @IsOptional()
    @IsString()
    @MaxLength(30)
    phone?: string;

    @ApiProperty({ description: 'Message content', example: 'Me gustaría saber si tienen disponibilidad para diciembre.', minLength: 5, maxLength: 2000 })
    @IsString()
    @MinLength(5)
    @MaxLength(2000)
    message: string;
}