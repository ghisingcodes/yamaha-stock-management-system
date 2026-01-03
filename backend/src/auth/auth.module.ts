import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { AuthService } from './auth.service';
import { Module } from '@nestjs/common';
import { UserSchema } from 'src/schemas/user.schema';

@Module({
  imports: [
    ConfigModule, // ← ADD THIS (load .env, ConfigService)
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is not set!');
        }

        return {
          secret,
          signOptions: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            expiresIn: (configService.get<string>('JWT_EXPIRES_IN') ||
              '1h') as any,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, RolesGuard], // ← JwtAuthGuard
  exports: [AuthService, JwtModule, JwtAuthGuard, RolesGuard], // ← JwtAuthGuard
})
export class AuthModule {}
