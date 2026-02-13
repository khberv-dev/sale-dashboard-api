import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@shared/entities/user.entity';
import { Repository } from 'typeorm';
import { UserRole } from '@shared/enum/user-role.enum';
import { CreateManagerRequest } from '@modules/user/dto/create-manager-request.dto';
import { hashPassword } from '@/utils/hash.util';
import { CrmProfile } from '@shared/entities/crm-profiles.entity';
import { AddCallRequest } from '@modules/user/dto/add-call-request.dto';
import { Call } from '@shared/entities/call.entity';

@Injectable()
export class ManagerService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(CrmProfile) private readonly crmProfileRepo: Repository<CrmProfile>,
    @InjectRepository(Call) private readonly callRepo: Repository<Call>,
  ) {}

  getManagers() {
    return this.userRepo
      .createQueryBuilder('u')
      .leftJoin(CrmProfile, 'cp', 'cp.user_id=u.id')
      .select([
        'u."id"',
        'u.first_name "firstName"',
        'u.last_name "lastName"',
        'u."username"',
        'u."avatar"',
        'u."plan"',
        'u.is_active "isActive"',
        'cp.lead_count "leadCount"',
        'cp.account_id "accountId"',
        'cp.sip_number "sipNumber"',
        'cp.call_duration "callDuration"',
        'u.created_at "createdAt"',
      ])
      .orderBy('u.created_at', 'DESC')
      .getRawMany();
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

  async addCall(data: AddCallRequest) {
    await this.callRepo.save({
      user: {
        id: data.userId,
      },
      duration: data.duration,
    });

    return {
      message: "Yozuv qo'shildi",
    };
  }
}
