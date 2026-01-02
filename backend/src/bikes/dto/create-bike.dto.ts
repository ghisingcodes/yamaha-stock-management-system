import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateBikeDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsNumber()
  @IsOptional()
  @Min(1900)
  year?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @IsString()
  @IsOptional()
  description?: string;
}
