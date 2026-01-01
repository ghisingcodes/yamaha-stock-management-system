// src/auth/auth.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User')
    private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const { username, password, role = 'user' } = dto;

    // Check if username already exists
    const exists = await this.userModel.findOne({ username });
    if (exists) {
      throw new BadRequestException('Username already taken');
    }

    // Hash password **only here**
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with already hashed password
    const user = await this.userModel.create({
      username,
      password: hashedPassword,
      role,
    });

    return this.generateToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ username: dto.username });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Compare plain password with stored hash
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(user);
  }

  private generateToken(user: User) {
    const payload = {
      sub: user._id.toString(),
      username: user.username,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
