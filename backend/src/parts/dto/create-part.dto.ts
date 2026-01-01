// src/parts/dto/create-part.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsArray,
  IsMongoId,
} from 'class-validator';

export class CreatePartDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stockQuantity?: number;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  compatibleBikes?: string[];
}
