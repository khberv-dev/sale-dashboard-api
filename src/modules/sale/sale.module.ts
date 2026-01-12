import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleController } from '@modules/sale/sale.controller';
import { SaleService } from '@modules/sale/sale.service';
import { Sale } from '@shared/entities/sale.entity';
import { SaleType } from '@shared/entities/sale-type.entity';
import { WsModule } from '@shared/modules/ws/ws.module';

@Module({
  imports: [TypeOrmModule.forFeature([Sale, SaleType]), WsModule],
  controllers: [SaleController],
  providers: [SaleService],
})
export class SaleModule {}
