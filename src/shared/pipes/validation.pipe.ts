import { ValidationPipe } from '@nestjs/common';

export const validationPipe = new ValidationPipe({
  forbidNonWhitelisted: true,
  whitelist: true,
  transform: true,
});
