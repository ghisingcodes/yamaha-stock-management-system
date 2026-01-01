import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { BikesModule } from './bikes/bikes.module';
import { PartsModule } from './parts/parts.module';
import { TransactionsModule } from './transactions/transaction.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI')!,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    BikesModule,
    PartsModule,
    TransactionsModule,
  ],
})
export class AppModule {}
