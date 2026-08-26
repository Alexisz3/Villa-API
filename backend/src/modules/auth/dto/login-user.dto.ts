import { IsEmail, IsString, MinLength, MaxLength } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
    @ApiProperty({ description: 'Email address of the user', example: 'admin@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'Password of the user', example: 'securepassword123', minLength: 8, maxLength: 100 })
    @IsString()
    @MinLength(8)
    @MaxLength(100)
    password: string;
}

