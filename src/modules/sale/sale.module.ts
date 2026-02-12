import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleController } from '@modules/sale/sale.controller';
import { SaleService } from '@modules/sale/sale.service';
import { Sale } from '@shared/entities/sale.entity';
import { SaleType } from '@shared/entities/sale-type.entity';
import { WsModule } from '@shared/modules/ws/ws.module';
import { NotifyModule } from '@shared/modules/notify/notify.module';
import { User } from '@shared/entities/user.entity';
import { SalaryBonus } from '@shared/entities/salary-bonus.entity';
import { StatsModule } from '@shared/modules/stats/stats.module';

@Module({
  imports: [TypeOrmModule.forFeature([Sale, SaleType, User, SalaryBonus]), WsModule, NotifyModule, StatsModule],
  controllers: [SaleController],
  providers: [SaleService],
})
export class SaleModule {}
