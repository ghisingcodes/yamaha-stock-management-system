import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BikeDocument = HydratedDocument<Bike>;

@Schema({ timestamps: true })
export class Bike {
  @Prop({ required: true })
  name: string;

  @Prop()
  model: string;

  @Prop()
  year: number;

  @Prop()
  price: number;

  @Prop()
  description: string;

  @Prop([{ type: String, default: [] }]) // Array of photo URLs
  photos: string[];

  @Prop([{ type: Types.ObjectId, ref: 'Part' }])
  parts: Types.ObjectId[];
}

export const BikeSchema = SchemaFactory.createForClass(Bike);
