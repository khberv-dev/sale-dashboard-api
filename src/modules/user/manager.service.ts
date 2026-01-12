import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@shared/entities/user.entity';
import { Repository } from 'typeorm';
import { UserRole } from '@shared/enum/user-role.enum';
import { CreateManagerRequest } from '@modules/user/dto/create-manager-request.dto';
import { hashPassword } from '@/utils/hash.util';

@Injectable()
export class ManagerService {
  constructor(@InjectRepository(User) private readonly userRepo: Repository<User>) {}

  async getManagers() {
    return await this.userRepo.find({
      where: {
        role: UserRole.MANAGER,
      },
      select: ['id', 'firstName', 'lastName', 'username', 'isActive', 'role', 'avatar', 'createdAt'],
      order: {
        createdAt: 'desc',
      },
    });
  }

  async createManager(data: CreateManagerRequest) {
    const existingManager = await this.userRepo.findOne({
      where: {
        username: data.username,
      },
    });

    if (existingManager) {
      throw new BadRequestException("Bu sotuv menejeri avval qo'shilgan");
    }

    const passwordHash = await hashPassword(data.password);

    await this.userRepo.save({
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      password: passwordHash,
      role: UserRole.MANAGER,
    });

    return {
      message: 'Sotuv menejeri yaratildi',
    };
  }
}
