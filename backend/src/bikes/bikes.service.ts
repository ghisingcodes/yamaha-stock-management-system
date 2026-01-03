import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bike } from '../schemas/bike.schema';
import { CreateBikeDto } from './dto/create-bike.dto';
import { UpdateBikeDto } from './dto/update-bike.dto';

@Injectable()
export class BikesService {
  constructor(@InjectModel(Bike.name) private bikeModel: Model<Bike>) {}

  async create(createBikeDto: CreateBikeDto & { photos?: string[] }) {
    const bike = new this.bikeModel(createBikeDto);
    return bike.save();
  }

  async findAll() {
    return this.bikeModel.find().populate('parts').exec();
  }

  async findOne(id: string) {
    const bike = await this.bikeModel.findById(id).populate('parts').exec();
    if (!bike) throw new NotFoundException('Bike not found');
    return bike;
  }

  async update(
    id: string,
    updateBikeDto: UpdateBikeDto & { photos?: string[] },
  ) {
    const bike = await this.bikeModel.findById(id);
    if (!bike) throw new NotFoundException('Bike not found');

    // Append new photos to existing ones
    if (updateBikeDto.photos) {
      bike.photos = [...(bike.photos || []), ...updateBikeDto.photos];
      delete updateBikeDto.photos; // Remove from main update
    }

    Object.assign(bike, updateBikeDto);
    return bike.save();
  }

  async remove(id: string) {
    const bike = await this.bikeModel.findById(id);
    if (!bike) throw new NotFoundException('Bike not found');
    return bike.deleteOne();
  }
}
