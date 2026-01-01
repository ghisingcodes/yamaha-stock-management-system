// src/auth/dto/register.dto.ts
import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsEnum(['user', 'admin'])
  @IsOptional()
  role?: 'user' | 'admin';
}
