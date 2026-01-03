// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Patch,
  Param,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ── Admin-only endpoints ───────────────────────────────────────────────

  @Post('admin/create-user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async createUserByAdmin(
    @Body()
    dto: { username: string; password: string; role?: 'user' | 'admin' },
    @Req() req: { user: { userId: string } },
  ) {
    return this.authService.createUserByAdmin(dto, req.user.userId);
  }

  @Patch('admin/users/:id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: { role: 'user' | 'admin' },
    @Req() req: { user: { userId: string } },
  ) {
    return this.authService.updateUserRole(id, dto.role, req.user.userId);
  }
}
