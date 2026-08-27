import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class FolderAssignment {
  @IsInt()
  @Min(1)
  id: number;

  @IsString()
  @MaxLength(80)
  folder: string;
}

// Reasigna la carpeta de varios recursos en una sola request. Lo usa el
// boton "Organizar automaticamente" del panel, que antes disparaba un PATCH
// por recurso y chocaba con el rate limit global.
export class AssignFoldersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => FolderAssignment)
  items: FolderAssignment[];
}
