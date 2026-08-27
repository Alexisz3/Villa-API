import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateContentSectionDto {
  @IsString()
  @IsNotEmpty()
  sectionName: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  banner?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') return [value];
    return value;
  })
  images?: string[];

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  // No se persiste en la sección: solo indica en qué carpeta de la
  // biblioteca de medios se registran los archivos subidos en esta request.
  @IsString()
  @IsOptional()
  folder?: string;
}
