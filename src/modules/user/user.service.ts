import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { User } from '@shared/entities/user.entity';
import { UpdateUserRequest } from '@modules/user/dto/update-user-request.dto';
import { checkPassword, hashPassword } from '@/utils/hash.util';
import { UpdatePasswordRequest } from '@modules/user/dto/update-password-request.dto';
import { CrmProfile } from '@shared/entities/crm-profiles.entity';
import { RegisterAttendanceRequest } from '@modules/user/dto/register-attendance-request.dto';
import { Attendance } from '@shared/entities/attendance.entity';
import dayjs from 'dayjs';
import { SalaryBonus } from '@shared/entities/salary-bonus.entity';
import { SalaryBonusType } from '@shared/enum/salary-bonus-type.enum';
import { ATTENDANCE_BONUS_SUM } from '@shared/constants';
import { Team } from '@shared/entities/team.entity';
import { PlanHistory } from '@shared/entities/plan-history.entity';
import { PositionHistory } from '@shared/entities/position-history.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(CrmProfile) private readonly crmProfileRepository: Repository<CrmProfile>,
    @InjectRepository(Attendance) private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(SalaryBonus) private readonly salaryBonusRepository: Repository<SalaryBonus>,
    @InjectRepository(PlanHistory) private readonly planHistoryRepository: Repository<PlanHistory>,
    @InjectRepository(PositionHistory) private readonly positionHistoryRepository: Repository<PositionHistory>,
  ) {}

  async getUserInfo(userId: string) {
    const user = await this.userRepo.findOne({
      where: {
        id: userId,
      },
      select: ['id', 'firstName', 'lastName', 'username', 'role', 'position', 'avatar', 'createdAt'],
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

    if (data.crmAccount) {
      await this.crmProfileRepository.save({
        accountId: data.crmAccount,
        sipNumber: data.sipNumber,
        userId,
      });
    }

    const positionChanged = data.position !== undefined && data.position !== manager.position;

    const updateData: Partial<User> = {
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      isActive: data.isActive,
    };

    if (data.password) {
      updateData.password = await hashPassword(data.password);
    }

    if (data.position !== undefined) {
      updateData.position = data.position;
    }

    updateData.team = { id: data.teamId } as Team;

    Object.assign(manager, updateData);

    await this.userRepo.save(manager);

    if (data.plan !== undefined) {
      await this.planHistoryRepository.save({
        user: { id: userId },
        plan: data.plan,
      });
    }

    if (positionChanged) {
      await this.positionHistoryRepository.save({
        user: { id: userId },
        position: data.position,
      });
    }

    return {
      message: 'Profil yangilandi',
    };
  }

  async setMonthPlan(userId: string, plan: number) {
    await this.planHistoryRepository.save({
      user: { id: userId },
      plan,
    });

    return {
      message: "Plan o'zgartirildi",
    };
  }

  async getMonthPlan(userId: string) {
    const lastPlan = await this.planHistoryRepository.findOne({
      where: {
        user: { id: userId },
      },
      order: {
        date: 'DESC',
      },
    });

    return lastPlan?.plan ?? 0;
  }

  async updatePassword(userId: string, data: UpdatePasswordRequest) {
    const user = await this.userRepo.findOne({
      where: {
        id: userId,
      },
      select: ['password'],
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

    const passwordHash = await hashPassword(data.password);

    await this.userRepo.update(userId, {
      password: passwordHash,
    });

    return {
      message: 'Parol yangilandi',
    };
  }

  async registerAttendance(data: RegisterAttendanceRequest) {
    const startDate = dayjs().startOf('day');
    const endDate = startDate.endOf('day');

    const attendance = await this.attendanceRepository.findOne({
      where: {
        user: { id: data.userId },
        date: Between(startDate.toDate(), endDate.toDate()),
      },
    });

    if (attendance) {
      throw new BadRequestException('Bu xodim kelgan');
    }

    await this.attendanceRepository.save({
      user: {
        id: data.userId,
      },
      date: new Date(),
    });

    await this.salaryBonusRepository.save({
      user: {
        id: data.userId,
      },
      amount: ATTENDANCE_BONUS_SUM,
      type: SalaryBonusType.ATTENDANCE,
      date: new Date(),
    });

    return {
      message: 'Qabul qilindi',
    };
  }

  getTodayAttendances() {
    const startDate = dayjs().startOf('day');
    const endDate = startDate.endOf('day');

    return this.userRepo.query(
      `select u.id, u.first_name as "firstName", u.last_name as "lastName", u.avatar, a.date as "attendanceDate"
       from users u
              left join attendances a on a.user_id = u.id and a.date between $1 and $2
       where u.role = 'MANAGER'`,
      [startDate.toDate(), endDate.toDate()],
    );
  }
}
