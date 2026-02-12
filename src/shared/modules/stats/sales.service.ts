import { Injectable } from '@nestjs/common';
import { Sale } from '@shared/entities/sale.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class SalesService {
  constructor(@InjectRepository(Sale) private readonly saleRepo: Repository<Sale>) {}

  async calculateManagerSale(managerUserId: string, startDate: Date, endDate: Date) {
    const [result] = await this.saleRepo.query(
      `select count(s.id) as "saleCount", coalesce(sum(s.amount), 0) as "saleAmount"
       from sales s
       where s.manager_id = $1
         and s.sale_at between $2 and $3`,
      [managerUserId, startDate, endDate],
    );

    return { count: result['saleCount'], amount: result['saleAmount'] };
  }
}
