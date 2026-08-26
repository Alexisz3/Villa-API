import { PartialType } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { CreateContentSectionDto } from './create-content-section.dto';

export class UpdateContentSectionDto extends PartialType(CreateContentSectionDto) {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return value;
    if (typeof value === 'string') return [value];
    return value;
  })
  imagesToRemove?: string[];

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  removeBanner?: boolean;
}
