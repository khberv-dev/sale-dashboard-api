import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaryBonus } from '@shared/entities/salary-bonus.entity';
import { SalaryService } from '@shared/modules/stats/salary.service';
import { SalesService } from '@shared/modules/stats/sales.service';
import { Sale } from '@shared/entities/sale.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SalaryBonus, Sale])],
  providers: [SalaryService, SalesService],
  exports: [SalaryService, SalesService],
})
export class StatsModule {}
