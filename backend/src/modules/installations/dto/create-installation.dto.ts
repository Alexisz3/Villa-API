import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInstallationDto {
  @ApiProperty({ description: 'Unique identifier string for the installation', example: 'pool-area' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ description: 'Display name of the installation', example: 'Piscina Principal' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Detailed description of the installation', example: 'Piscina templada con área para niños', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Whether the installation is active and available', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
