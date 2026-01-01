// src/parts/dto/update-part.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreatePartDto } from './create-part.dto';

export class UpdatePartDto extends PartialType(CreatePartDto) {}
