import { PartialType } from '@nestjs/mapped-types';
import { CreateBikeDto } from './create-bike.dto';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateBikeDto extends PartialType(CreateBikeDto) {
  @IsNumber()
  @IsOptional()
  @Min(0)
  newPrice?: number; // Special field to trigger price history update

  @IsNumber()
  @IsOptional()
  @Min(0)
  stockQuantity?: number;
}
