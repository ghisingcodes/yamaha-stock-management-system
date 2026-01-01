import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bike } from '../schemas/bike.schema';
import { CreateBikeDto } from './dto/create-bike.dto';
import { UpdateBikeDto } from './dto/update-bike.dto';

@Injectable()
export class BikesService {
  constructor(@InjectModel('Bike') private bikeModel: Model<Bike>) {}

  async create(createBikeDto: CreateBikeDto): Promise<Bike> {
    // Convert string ids → ObjectId
    const parts =
      createBikeDto.parts?.map((id) => new Types.ObjectId(id)) || [];

    const bike = new this.bikeModel({
      ...createBikeDto,
      parts,
    });

    return bike.save();
  }

  async findAll(): Promise<Bike[]> {
    return this.bikeModel.find().populate('parts').exec();
  }

  async findOne(id: string): Promise<Bike> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid ID');
    const bike = await this.bikeModel.findById(id).populate('parts').exec();
    if (!bike) throw new NotFoundException(`Bike #${id} not found`);
    return bike;
  }

  async update(id: string, updateBikeDto: UpdateBikeDto): Promise<Bike> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid ID');

    const parts = updateBikeDto.parts?.map((id) => new Types.ObjectId(id));

    const updated = await this.bikeModel
      .findByIdAndUpdate(
        id,
        { $set: { ...updateBikeDto, ...(parts && { parts }) } },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updated) throw new NotFoundException(`Bike #${id} not found`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid ID');
    const result = await this.bikeModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Bike #${id} not found`);
  }
}
