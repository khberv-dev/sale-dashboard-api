import { NestFactory } from '@nestjs/core';
import { AppModule } from '@core/app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { validationPipe } from '@shared/pipes/validation.pipe';

async function bootstrap() {
  const logger = new Logger('App');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('PORT');

  app.enableCors();
  app.useGlobalPipes(validationPipe);

  await app.listen(port);
  logger.log(`Listening on :${port}`);
}

bootstrap();
