import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmProfile } from '@shared/entities/crm-profiles.entity';
import { SynchronizeService } from '@modules/integration/synchronize.service';
import { AmocrmService } from '@modules/integration/amocrm.service';
import { SipuniService } from '@modules/integration/sipuni.service';
import { StaffBotService } from '@modules/integration/staff-bot.service';
import { User } from '@shared/entities/user.entity';
import { SalaryBonus } from '@shared/entities/salary-bonus.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, CrmProfile, SalaryBonus])],
  providers: [SynchronizeService, AmocrmService, SipuniService, StaffBotService],
})
export class IntegrationModule {}
