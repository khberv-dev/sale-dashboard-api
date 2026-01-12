import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@shared/entities/user.entity';
import { UpdateUserRequest } from '@modules/user/dto/update-user-request.dto';
import { hashPassword } from '@/utils/hash.util';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private readonly userRepo: Repository<User>) {}

  async getUserInfo(userId: string) {
    const user = await this.userRepo.findOne({
      where: {
        id: userId,
      },
      select: ['id', 'firstName', 'lastName', 'username', 'role', 'avatar', 'createdAt'],
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }

  async updateUserAvatar(userId: string, fileName: string) {
    await this.userRepo.update(userId, {
      avatar: fileName,
    });

    return {
      message: 'Profil yangilandi',
    };
  }

  async updateUser(userId: string, data: UpdateUserRequest) {
    const manager = await this.userRepo.findOne({
      where: {
        id: userId,
      },
    });

    if (!manager) {
      throw new BadRequestException('Sotuv menejer topilmadi');
    }

    const existingUsername = await this.userRepo.findOne({
      where: {
        username: data.username,
      },
    });

    if (existingUsername && manager.username !== data.username) {
      throw new BadRequestException('Boshqa login kiriting');
    }

    let updateData: Partial<User> = {
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
    };

    if (data.password) {
      const passwordHash = await hashPassword(data.password);

      updateData = { ...updateData, password: passwordHash };
    }

    await this.userRepo.update(userId, updateData);

    return {
      message: 'Profil yangilandi',
    };
  }
}
