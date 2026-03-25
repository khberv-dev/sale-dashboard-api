import 'tsconfig-paths/register';
import dataSource from '@/config/data-source.config';
import { User } from '@shared/entities/user.entity';
import { randomPassword } from '@/utils/randomize.util';
import { hashPassword } from '@/utils/hash.util';
import { UserRole } from '@shared/enum/user-role.enum';
import * as fs from 'node:fs';

async function seed() {
  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);

  const adminUsername = 'admin';
  const adminPassword = randomPassword();
  const adminPasswordHash = await hashPassword(adminPassword);

  await userRepo.save({
    username: adminUsername,
    firstName: 'Admin',
    password: adminPasswordHash,
    role: UserRole.ADMIN,
  });

  await dataSource.destroy();

  fs.writeFileSync('.password', `${adminUsername}:${adminPassword}`);
}

seed();
