// src/transactions/dto/create-transaction.dto.ts
import {
  IsEnum,
  IsNotEmpty,
  IsMongoId,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';

export class CreateTransactionDto {
  @IsEnum(['purchase', 'sale'])
  @IsNotEmpty()
  type: 'purchase' | 'sale';

  @IsEnum(['bike', 'part'])
  @IsNotEmpty()
  itemType: 'bike' | 'part';

  @IsMongoId()
  @IsNotEmpty()
  itemId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @IsOptional()
  amount?: number;
}
