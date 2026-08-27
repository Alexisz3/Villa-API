import {
  IsBooleanString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryMediaDto {
  @IsString()
  @IsOptional()
  folder?: string;

  @IsString()
  @IsOptional()
  search?: string;

  // "true" para listar la papelera (recursos con deletedAt).
  @IsBooleanString()
  @IsOptional()
  trashed?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  @IsOptional()
  pageSize?: number;
}
