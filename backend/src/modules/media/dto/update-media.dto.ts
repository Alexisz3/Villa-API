import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMediaDto {
  @IsString()
  @IsOptional()
  @MaxLength(300)
  alt?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  folder?: string;
}
