// src/auth/auth.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
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

  async register(registerDto: RegisterDto): Promise<{ access_token: string }> {
    const { username, password } = registerDto;

    // Check if this is the VERY FIRST user
    const userCount = await this.userModel.countDocuments();

    const role = userCount === 0 ? 'admin' : 'user';

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userModel.create({
      username,
      password: hashedPassword,
      role,
    });

    return this.generateToken(user);
  }

  async createUserByAdmin(
    createUserDto: {
      username: string;
      password: string;
      role?: 'user' | 'admin';
    },
    currentUserId: string,
  ) {
    const admin = await this.userModel.findById(currentUserId);
    if (!admin || admin.role !== 'admin') {
      throw new ForbiddenException(
        'Only admins can create users or change roles',
      );
    }

    const { username, password, role = 'user' } = createUserDto;

    const exists = await this.userModel.findOne({ username });
    if (exists) throw new BadRequestException('Username already exists');

    const hashed = await bcrypt.hash(password, 10);

    const newUser = await this.userModel.create({
      username,
      password: hashed,
      role,
    });

    return { message: 'User created successfully', userId: newUser._id };
  }

  async updateUserRole(
    userId: string,
    newRole: 'user' | 'admin',
    currentUserId: string,
  ) {
    const admin = await this.userModel.findById(currentUserId);
    if (!admin || admin.role !== 'admin') {
      throw new ForbiddenException('Only admins can change roles');
    }

    const target = await this.userModel.findById(userId);
    if (!target) throw new NotFoundException('User not found');

    target.role = newRole;
    await target.save();

    return { message: `User role updated to ${newRole}` };
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
