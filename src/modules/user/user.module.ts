import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from '@modules/user/user.controller';
import { UserService } from '@modules/user/user.service';
import { User } from '@shared/entities/user.entity';
import { ManagerController } from '@modules/user/manager.controller';
import { ManagerService } from '@modules/user/manager.service';
import { CrmProfile } from '@shared/entities/crm-profiles.entity';
import { Attendance } from '@shared/entities/attendance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, CrmProfile, Attendance])],
  controllers: [UserController, ManagerController],
  providers: [UserService, ManagerService],
})
export class UserModule {}
