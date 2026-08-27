import { IsOptional, IsString, MaxLength } from 'class-validator';

// Campo opcional que acompaña la subida multipart: la carpeta/categoría con
// la que se etiqueta cada archivo nuevo (ej. "cavas" al subir desde el
// selector de una sección de Cavas).
export class UploadMediaDto {
  @IsString()
  @IsOptional()
  @MaxLength(80)
  folder?: string;
}
