import { SetMetadata } from '@nestjs/common';

export const IS_ADMIN_KEY = 'is_admin';
export const IsAdmin = () => SetMetadata(IS_ADMIN_KEY, true);
