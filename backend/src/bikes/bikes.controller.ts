import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { BikesService, BikeResponse } from './bikes.service'; // ← Import BikeResponse here
import { CreateBikeDto } from './dto/create-bike.dto';
import { UpdateBikeDto } from './dto/update-bike.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('bikes')
export class BikesController {
  constructor(private readonly bikesService: BikesService) {}

  @Get()
  findAll(): Promise<BikeResponse[]> {
    return this.bikesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<BikeResponse> {
    return this.bikesService.findOne(id);
  }

  @Post()
  @UseInterceptors(
    FilesInterceptor('photos', 10, {
      // 'photos' matches formData.append('photos')
      storage: diskStorage({
        destination: './uploads', // or use cloud storage
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
    }),
  )
  async create(
    @Body() body: any,
    @UploadedFiles() photos: Express.Multer.File[],
  ) {
    console.log('Received body:', body);
    console.log('Uploaded photos:', photos);

    const existingPhotos = body.existingPhotos
      ? JSON.parse(body.existingPhotos)
      : [];

    const photoPaths = [
      ...existingPhotos,
      ...photos.map((file) => `/uploads/${file.filename}`),
    ];

    const bikeData = {
      name: body.name,
      model: body.model,
      year: body.year ? Number(body.year) : undefined,
      price: body.price ? Number(body.price) : undefined,
      description: body.description,
      stockQuantity: body.stockQuantity ? Number(body.stockQuantity) : 0,
      photos: photoPaths,
    };

    return this.bikesService.create(bikeData);
  }

  // Patch (edit) - similar to Post but with ID
  @Patch(':id')
  @UseInterceptors(
    FilesInterceptor('photos', 10, {
      /* same config as above */
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() photos: Express.Multer.File[],
  ) {
    const existingPhotos = body.existingPhotos
      ? JSON.parse(body.existingPhotos)
      : [];

    const photoPaths = [
      ...existingPhotos,
      ...photos.map((file) => `/uploads/${file.filename}`),
    ];

    const updateData = {
      name: body.name,
      model: body.model,
      year: body.year ? Number(body.year) : undefined,
      price: body.price ? Number(body.price) : undefined,
      description: body.description,
      stockQuantity: body.stockQuantity
        ? Number(body.stockQuantity)
        : undefined,
      photos: photoPaths,
    };

    return this.bikesService.update(id, updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.bikesService.remove(id);
  }
}
