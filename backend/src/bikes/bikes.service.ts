import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose'; // ← Import Document
import { Bike } from '../schemas/bike.schema';
import { CreateBikeDto } from './dto/create-bike.dto';
import { UpdateBikeDto } from './dto/update-bike.dto';

// Export response interface
export interface BikeResponse {
  _id: string;
  name: string;
  model?: string;
  year?: number;
  price: number;
  description?: string;
  photos?: string[];
  parts?: any[];
  stockQuantity: number;
  availability: 'In Stock' | 'Out of Stock';
  priceHistory: { price: number; date: Date }[];
}

@Injectable()
export class BikesService {
  constructor(@InjectModel('Bike') private bikeModel: Model<Bike>) {}

  async create(
    createBikeDto: CreateBikeDto,
    photoUrls: string[] = [],
  ): Promise<Bike> {
    const bike = new this.bikeModel({
      ...createBikeDto,
      photos: photoUrls,
      priceHistory: createBikeDto.price
        ? [{ price: createBikeDto.price, date: new Date() }]
        : [],
    });
    return bike.save();
  }

  async findAll(): Promise<BikeResponse[]> {
    const bikes = await this.bikeModel.find().populate('parts').exec();
    return bikes.map((bike) => this.toResponse(bike));
  }

  async findOne(id: string): Promise<BikeResponse> {
    const bike = await this.bikeModel.findById(id).populate('parts').exec();
    if (!bike) throw new NotFoundException('Bike not found');
    return this.toResponse(bike);
  }

  private toResponse(bike: Bike & Document): BikeResponse {
    const plain = bike.toJSON(); // Use toJSON() - safer and recommended in Mongoose 8+
    return {
      ...plain,
      availability: bike.stockQuantity > 0 ? 'In Stock' : 'Out of Stock',
      priceHistory: bike.priceHistory || [],
    };
  }

  async update(
    id: string,
    updateBikeDto: UpdateBikeDto,
    newPhotoUrls?: string[],
  ): Promise<Bike> {
    const bike = await this.bikeModel.findById(id);
    if (!bike) throw new NotFoundException('Bike not found');

    if (updateBikeDto.newPrice !== undefined) {
      if (updateBikeDto.newPrice < 0)
        throw new BadRequestException('Price cannot be negative');
      bike.price = updateBikeDto.newPrice;
      bike.priceHistory.push({
        price: updateBikeDto.newPrice,
        date: new Date(),
      });
    }

    if (updateBikeDto.stockQuantity !== undefined) {
      if (updateBikeDto.stockQuantity < 0)
        throw new BadRequestException('Stock cannot be negative');
      bike.stockQuantity = updateBikeDto.stockQuantity;
    }

    if (newPhotoUrls && newPhotoUrls.length > 0) {
      bike.photos = [...(bike.photos || []), ...newPhotoUrls];
    }

    Object.assign(bike, updateBikeDto);
    return bike.save();
  }

  async remove(id: string): Promise<void> {
    const bike = await this.bikeModel.findById(id);
    if (!bike) throw new NotFoundException('Bike not found');
    await bike.deleteOne();
  }
}
