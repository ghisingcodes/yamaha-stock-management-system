// src/bikes/bikes.controller.ts
import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { BikesService } from './bikes.service';
import { CreateBikeDto } from './dto/create-bike.dto';
import { UpdateBikeDto } from './dto/update-bike.dto';

@Controller('bikes')
export class BikesController {
  constructor(private readonly bikesService: BikesService) {}

  @Get()
  findAll() {
    return this.bikesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bikesService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(
    FilesInterceptor('photos', 10, {
      storage: diskStorage({
        destination: './uploads/bikes',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname).toLowerCase();
          callback(null, `bike-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const ext = extname(file.originalname).toLowerCase();
        if (!allowedTypes.test(ext)) {
          return callback(
            new BadRequestException(
              'Only images (jpg, jpeg, png, webp) allowed',
            ),
            false,
          );
        }
        callback(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max per file
    }),
  )
  async create(
    @Body() body: any, // ← use 'any' for raw multipart fields
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    console.log('Raw body:', body);
    console.log('Uploaded files count:', files?.length || 0);

    // Manually validate required fields (since DTO validation skips multipart)
    if (!body.name) {
      throw new BadRequestException('Name is required');
    }

    const photoUrls = files
      ? files.map((file) => `/uploads/bikes/${file.filename}`)
      : [];

    const createDto: CreateBikeDto = {
      name: body.name,
      model: body.model || undefined,
      year: body.year ? Number(body.year) : undefined,
      price: body.price ? Number(body.price) : undefined,
      description: body.description || undefined,
    };

    return this.bikesService.create({ ...createDto, photos: photoUrls });
  }

  // Similar for PATCH (update)
  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(
    FilesInterceptor('photos', 10, {
      storage: diskStorage({
        destination: './uploads/bikes',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname).toLowerCase();
          callback(null, `bike-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const ext = extname(file.originalname).toLowerCase();
        if (!allowedTypes.test(ext)) {
          return callback(
            new BadRequestException(
              'Only images (jpg, jpeg, png, webp) allowed',
            ),
            false,
          );
        }
        callback(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const photoUrls = files
      ? files.map((file) => `/uploads/bikes/${file.filename}`)
      : undefined;

    const updateDto: UpdateBikeDto = {
      name: body.name,
      model: body.model,
      year: body.year ? Number(body.year) : undefined,
      price: body.price ? Number(body.price) : undefined,
      description: body.description,
    };

    return this.bikesService.update(id, { ...updateDto, photos: photoUrls });
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.bikesService.remove(id);
  }
}
