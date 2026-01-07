import { PartialType } from '@nestjs/mapped-types';
import { CreateBikeDto } from './create-bike.dto';
import { IsOptional, IsNumber, Min, IsArray, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBikeDto extends PartialType(CreateBikeDto) {
  // Optional numeric fields
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1900)
  year?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  newPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  // Optional array of new photos
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
}
