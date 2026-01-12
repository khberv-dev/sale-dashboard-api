import 'tsconfig-paths/register';
import dataSource from '@/config/data-source.config';
import { User } from '@shared/entities/user.entity';
import { randomPassword } from '@/utils/randomize.util';
import { hashPassword } from '@/utils/hash.util';
import { UserRole } from '@shared/enum/user-role.enum';

async function seedDatabase() {
  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const adminUsername = 'admin';
  const adminPassword = randomPassword();
  const adminPasswordHash = await hashPassword(adminPassword);

  const admin = await userRepo.save({
    username: adminUsername,
    firstName: 'Admin',
    password: adminPasswordHash,
    role: UserRole.ADMIN,
  });

  console.log(`Created user: ${admin.id}\n${adminUsername}:${adminPassword}`);
}

seedDatabase();
