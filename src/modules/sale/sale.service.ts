import { Injectable } from '@nestjs/common';
import { CreateSaleRequest } from '@modules/sale/dto/create-sale-request.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from '@shared/entities/sale.entity';
import dayjs from 'dayjs';
import { SaleType } from '@shared/entities/sale-type.entity';
import { CreateSaleTypeRequest } from '@modules/sale/dto/create-sale-type-request.dto';
import { GetStatsFilter } from '@modules/sale/dto/get-stats-filter.dto';
import { User } from '@shared/entities/user.entity';
import { EventGateway } from '@shared/modules/ws/event.gateway';
import { UpdateSaleTypeRequest } from '@modules/sale/dto/update-sale-type-request.dto';

@Injectable()
export class SaleService {
  constructor(
    @InjectRepository(Sale) private readonly saleRepo: Repository<Sale>,
    @InjectRepository(SaleType) private readonly saleTypeRepo: Repository<SaleType>,
    private readonly eventGateway: EventGateway,
  ) {}

  async createSale(managerId: string, data: CreateSaleRequest) {
    const saleDateTime = dayjs(data.date + ' ' + data.time, 'YYYY-MM-DD HH:mm');

    const newSale = await this.saleRepo.save({
      manager: { id: managerId },
      amount: data.amount,
      type: { id: data.type },
      saleAt: saleDateTime.toDate(),
    });

    const newSaleData: any = await this.saleRepo
      .createQueryBuilder('s')
      .leftJoin(User, 'm', 'm.id=s.manager_id')
      .select(['s."id"', 's."amount"', 'm."first_name" "firstName"', 'm."last_name" "lastName"', 'm."avatar"'])
      .where('s.id=:saleId', { saleId: newSale.id })
      .getRawOne();

    this.eventGateway.broadcast('new-sale', newSaleData);

    return {
      message: 'Sotuv tasdiqlandi',
    };
  }

  async createSaleType(data: CreateSaleTypeRequest) {
    await this.saleTypeRepo.save({
      name: data.name,
    });

    return {
      message: 'Sotuv turi yaratildi',
    };
  }

  private getManagerSales(startDate: Date, endDate: Date): Promise<any[]> {
    return this.saleRepo.query(
      `SELECT m.first_name as "firstName", m.last_name as "lastName", m.avatar, SUM(s.amount) as "sale"
       FROM sales s
              LEFT JOIN users m
                        ON m.id = s.manager_id
       WHERE s.sale_at BETWEEN $1
               AND $2
       GROUP BY m.username, m.first_name, m.last_name, m.avatar`,
      [startDate, endDate],
    );
  }

  async getStats(filter: GetStatsFilter) {
    const now = dayjs();
    const startOfDay = now.startOf('day').toDate();
    const endOfDay = now.endOf('day').toDate();
    const dailyResult: any[] = await this.getManagerSales(startOfDay, endOfDay);
    const totalResult: any[] = await this.getManagerSales(filter.startDate, filter.endDate);

    let dailyAmount = 0;
    let totalAmount = 0;

    dailyResult.forEach((manager) => (dailyAmount += Number(manager.sale)));
    totalResult.forEach((manager) => (totalAmount += Number(manager.sale)));

    return {
      daily: dailyResult,
      dailyAmount,
      total: totalResult,
      totalAmount,
    };
  }

  getSales() {
    return this.saleRepo
      .createQueryBuilder('s')
      .leftJoin(User, 'u', 'u.id=s.manager_id')
      .leftJoin(SaleType, 'st', 'st.id=s.type_id')
      .select([
        's."id"',
        's."amount"',
        's.sale_at "saleAt"',
        'u.first_name "firstName"',
        'u.last_name "lastName"',
        'st.name "saleType"',
      ])
      .orderBy('s.created_at', 'DESC')
      .getRawMany();
  }

  getTypes() {
    return this.saleTypeRepo.find({
      order: {
        createdAt: 'desc',
      },
    });
  }

  getTypeOptions() {
    return this.saleTypeRepo.find({
      order: {
        createdAt: 'desc',
      },
      where: {
        isActive: true,
      },
    });
  }

  async updateType(id: string, data: UpdateSaleTypeRequest) {
    await this.saleTypeRepo.update(id, data);

    return {
      message: 'Sotuv turi yangilandi',
    };
  }
}
