import { Injectable } from '@nestjs/common';
import { Sale } from '@shared/entities/sale.entity';
import { Between, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@shared/entities/user.entity';
import { UserRole } from '@shared/enum/user-role.enum';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale) private readonly saleRepo: Repository<Sale>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

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

  calculateSalesCount(startDate: Date, endDate: Date) {
    return this.saleRepo.count({
      where: {
        saleAt: Between(startDate, endDate),
      },
    });
  }

  async getTotalLeadsCount() {
    const admin = await this.userRepo.findOne({
      where: {
        role: UserRole.ADMIN,
      },
      relations: ['crmProfile'],
    });

    return admin?.crmProfile ? admin?.crmProfile.leadCount : 0;
  }
}
