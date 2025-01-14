import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';

const CorsConfig = {
  origin: '*',
  methods: 'GET,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get('APPLICATION_PORT');

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors(CorsConfig);

  await app.listen(port);
  Logger.log(`Application is running on port ${port}`, 'Bootstrap');
}
bootstrap();
