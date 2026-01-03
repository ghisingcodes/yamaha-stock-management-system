// src/transactions/transactions.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TransactionSchema } from '../schemas/transaction.schema';
import { PartSchema } from '../schemas/part.schema';
import { BikeSchema } from '../schemas/bike.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Transaction', schema: TransactionSchema },
      { name: 'Part', schema: PartSchema },
      { name: 'Bike', schema: BikeSchema },
    ]),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
