import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaryBonus } from '@shared/entities/salary-bonus.entity';
import { SalaryService } from '@shared/modules/stats/salary.service';
import { SalesService } from '@shared/modules/stats/sales.service';
import { Sale } from '@shared/entities/sale.entity';
import { User } from '@shared/entities/user.entity';
import { CallsService } from '@shared/modules/stats/calls.service';
import { Call } from '@shared/entities/call.entity';
import { PlanHistory } from '@shared/entities/plan-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, SalaryBonus, Sale, Call, PlanHistory])],
  providers: [SalaryService, SalesService, CallsService],
  exports: [SalaryService, SalesService, CallsService],
})
export class StatsModule {}
