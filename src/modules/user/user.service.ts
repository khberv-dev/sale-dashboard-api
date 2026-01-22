import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@shared/entities/user.entity';
import { UpdateUserRequest } from '@modules/user/dto/update-user-request.dto';
import { checkPassword, hashPassword } from '@/utils/hash.util';
import { UpdatePasswordRequest } from '@modules/user/dto/update-password-request.dto';

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

  async setMonthPlan(userId: string, plan: number) {
    await this.userRepo.update(userId, {
      plan,
    });

    return {
      message: "Plan o'zgartirildi",
    };
  }

  async getMonthPlan(userId: string) {
    const user = await this.userRepo.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new BadRequestException();
    }

    return user.plan;
  }

  async updatePassword(userId: string, data: UpdatePasswordRequest) {
    const user = await this.userRepo.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const isValidPassword = await checkPassword(data.oldPassword, user.password);

    if (!isValidPassword) {
      throw new BadRequestException('Eski parol xato');
    }

    if (data.password !== data.passwordConfirm) {
      throw new BadRequestException('Parol tasdiqlanmagan');
    }

    user.password = await hashPassword(data.password);
    await this.userRepo.save(user);

    return {
      message: 'Parol yangilandi',
    };
  }
}
