import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({
    origin: ['http://localhost:4200'],
    credentials: true,
  });

  // main.ts or app.module.ts
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // removes extra properties (default: false in some setups)
      forbidNonWhitelisted: false, // ← change from true to false during dev
      transform: true,
    }),
  );

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const port = config.get('PORT') || 3000;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  await app.listen(port);
  console.log(`Application running on: http://localhost:${port}`);
}
void bootstrap();
