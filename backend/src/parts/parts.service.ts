// src/parts/parts.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Part } from '../schemas/part.schema';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';

@Injectable()
export class PartsService {
  constructor(@InjectModel('Part') private partModel: Model<Part>) {}

  async create(createPartDto: CreatePartDto): Promise<Part> {
    const created = new this.partModel(createPartDto);
    return created.save();
  }

  async findAll(): Promise<Part[]> {
    return this.partModel.find().populate('compatibleBikes').exec();
  }

  async findOne(id: string): Promise<Part> {
    const part = await this.partModel
      .findById(id)
      .populate('compatibleBikes')
      .exec();
    if (!part) {
      throw new NotFoundException(`Part #${id} not found`);
    }
    return part;
  }

  async update(id: string, updatePartDto: UpdatePartDto): Promise<Part> {
    const updated = await this.partModel
      .findByIdAndUpdate(id, updatePartDto, { new: true, runValidators: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Part #${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.partModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Part #${id} not found`);
    }
  }
}
