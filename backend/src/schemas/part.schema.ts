// src/schemas/part.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';

export type PartDocument = HydratedDocument<Part>;

@Schema({ timestamps: true })
export class Part {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  price: number;

  @Prop({ default: 0 })
  stockQuantity: number;

  @Prop([{ type: Types.ObjectId, ref: 'Bike' }])
  compatibleBikes: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  photos: string[];
}

export const PartSchema = SchemaFactory.createForClass(Part);
