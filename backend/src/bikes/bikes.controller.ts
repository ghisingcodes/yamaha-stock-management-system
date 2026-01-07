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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(
    FilesInterceptor('photos', 10, {
      storage: diskStorage({
        destination: './uploads/bikes', // or use cloud storage
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
    @Body() createBikeDto: CreateBikeDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const uploaded = (files || []).map((f) => `/uploads/bikes/${f.filename}`);
    createBikeDto.photos = uploaded;

    console.log('Dto create', createBikeDto);
    return this.bikesService.create(createBikeDto);
  }

  // Patch (edit) - similar to Post but with ID
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(
    FilesInterceptor('photos', 10, {
      storage: diskStorage({
        destination: './uploads/bikes', // or use cloud storage
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
      ...photos.map((file) => `/uploads/bikes/${file.filename}`),
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
