import { applyDecorators, UseGuards } from '@nestjs/common';
import { RolesGuard } from '@common/guards/roles.guard';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

export const DefaultAuthGuard = applyDecorators(UseGuards(JwtAuthGuard, RolesGuard));
