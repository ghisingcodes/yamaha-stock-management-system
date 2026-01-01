// src/schemas/transaction.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({ timestamps: true })
export class Transaction {
  save(): Transaction | PromiseLike<Transaction> {
    throw new Error('Method not implemented.');
  }
  @Prop({ required: true })
  type: 'purchase' | 'sale';

  @Prop({ required: true })
  itemType: 'bike' | 'part';

  @Prop({ type: Types.ObjectId, required: true })
  itemId: Types.ObjectId;

  @Prop({ required: true })
  quantity: number;

  @Prop()
  amount: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
TransactionSchema.index({ createdAt: -1 });
