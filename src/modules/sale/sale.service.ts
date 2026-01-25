import { BadRequestException, Injectable } from '@nestjs/common';
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
import { BotService } from '@shared/modules/notify/bot.service';
import { UserRole } from '@shared/enum/user-role.enum';

@Injectable()
export class SaleService {
  constructor(
    @InjectRepository(Sale) private readonly saleRepo: Repository<Sale>,
    @InjectRepository(SaleType) private readonly saleTypeRepo: Repository<SaleType>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly eventGateway: EventGateway,
    private readonly botService: BotService,
  ) {}

  private async getAdminPlan() {
    const admin = await this.userRepo.findOne({
      where: {
        role: UserRole.ADMIN,
      },
    });

    if (!admin) {
      throw new BadRequestException('Admin not found');
    }

    return admin.plan;
  }

  calculateSalary(saleAmount: number) {
    const fixedAmount = 2_000_000;
    let bonus = 0;

    switch (true) {
      case saleAmount > 50_000_000:
        bonus = saleAmount * 0.1;
        break;
      case saleAmount > 40_000_000:
        bonus = saleAmount * 0.09;
        break;
      case saleAmount > 30_000_000:
        bonus = saleAmount * 0.07;
        break;
      case saleAmount > 20_000_000:
        bonus = saleAmount * 0.05;
        break;
      case saleAmount > 10_000_000:
        bonus = saleAmount * 0.03;
        break;
    }

    return fixedAmount + bonus;
  }

  async createSale(managerId: string, data: CreateSaleRequest) {
    const saleDateTime = dayjs(data.date + ' ' + data.time, 'YYYY-MM-DD HH:mm');

    const newSale = await this.saleRepo.save({
      manager: { id: managerId },
      amount: data.amount,
      contractNumber: data.contractNumber,
      type: { id: data.type },
      saleAt: saleDateTime.toDate(),
    });

    const newSaleData: any = await this.saleRepo
      .createQueryBuilder('s')
      .leftJoin(User, 'm', 'm.id=s.manager_id')
      .leftJoin(SaleType, 'st', 'st.id=s.type_id')
      .select([
        's."id"',
        's."amount"',
        'm."first_name" "firstName"',
        'm."last_name" "lastName"',
        'm."avatar"',
        'st.name type',
      ])
      .where('s.id=:saleId', { saleId: newSale.id })
      .getRawOne();

    const startDate = dayjs().startOf('month').toDate();
    const endDate = dayjs().endOf('month').toDate();
    const stats = await this.getStats({ startDate, endDate });

    this.eventGateway.broadcast('new-sale', newSaleData);
    this.botService.notifySale(
      newSaleData.firstName,
      newSaleData.lastName,
      newSaleData.amount,
      stats.dailyAmount,
      stats.totalAmount,
      newSaleData.type,
    );

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

  private async getManagersResult(startDate: Date, endDate: Date): Promise<any[]> {
    const result = await this.saleRepo.query(
      `SELECT m.first_name as "firstName", m.last_name as "lastName", m.avatar, m.plan, SUM(s.amount) as "sale"
       FROM sales s
              LEFT JOIN users m
                        ON m.id = s.manager_id
       WHERE s.sale_at BETWEEN $1
               AND $2
       GROUP BY m.username, m.first_name, m.last_name, m.avatar, m.plan`,
      [startDate, endDate],
    );

    return result.map((manager) => ({ ...manager, salary: this.calculateSalary(manager.sale) }));
  }

  private async getDailyStat() {
    const startDate = dayjs().startOf('month').format('YYYY-MM-DD');
    const endDate = dayjs().endOf('month').format('YYYY-MM-DD');

    const data: any[] = await this.saleRepo.query(
      `WITH date_range AS (SELECT generate_series(
                                    $1::date,
                                    $2::date,
                                    INTERVAL '1 day'
                                  ) ::date AS day)
      SELECT COALESCE(SUM(s.amount), 0) AS sale
      FROM date_range d
             LEFT JOIN sales s
                       ON s.sale_at::date = d.day
      GROUP BY d.day
      ORDER BY d.day;`,
      [startDate, endDate],
    );

    return data.map((x) => Number(x.sale));
  }

  private async getMonthlyStat() {
    const startDate = dayjs().subtract(6, 'month').format('YYYY-MM-DD');
    const endDate = dayjs().format('YYYY-MM-DD');

    const data: any[] = await this.saleRepo.query(
      `WITH month_range AS (SELECT generate_series(
                                     date_trunc('month', $1::date),
                                     date_trunc('month', $2::date),
                                     INTERVAL '1 month'
                                   ) ::date AS month
         )
      SELECT m.month,
             COALESCE(SUM(s.amount), 0) AS sale
      FROM month_range m
             LEFT JOIN sales s
                       ON s.sale_at >= m.month
                         AND s.sale_at < m.month + INTERVAL '1 month'
      GROUP BY m.month
      ORDER BY m.month;`,
      [startDate, endDate],
    );

    return data.map((x) => Number(x.sale));
  }

  async getStats(filter: GetStatsFilter) {
    const now = dayjs();
    const startOfDay = now.startOf('day').toDate();
    const endOfDay = now.endOf('day').toDate();
    const dailyResult: any[] = await this.getManagersResult(startOfDay, endOfDay);
    const totalResult: any[] = await this.getManagersResult(filter.startDate, filter.endDate);
    const dailyStats = await this.getDailyStat();
    const monthlyStats = await this.getMonthlyStat();
    const monthPlan = await this.getAdminPlan();

    let dailyAmount = 0;
    let totalAmount = 0;

    dailyResult.forEach((manager) => (dailyAmount += Number(manager.sale)));
    totalResult.forEach((manager) => (totalAmount += Number(manager.sale)));

    return {
      daily: dailyResult,
      dailyStats,
      monthlyStats,
      dailyAmount,
      total: totalResult,
      totalAmount,
      monthPlan,
    };
  }

  async getSales(page: number) {
    const pageSize = 15;

    const data = await this.saleRepo
      .createQueryBuilder('s')
      .leftJoin(User, 'm', 'm.id=s.manager_id')
      .leftJoin(SaleType, 'st', 'st.id=s.type_id')
      .select([
        's."id"',
        's."amount"',
        's.sale_at "saleAt"',
        'm.first_name "firstName"',
        'm.last_name "lastName"',
        'm."avatar"',
        'st.name "saleType"',
      ])
      .orderBy('s.created_at', 'DESC')
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getRawMany();

    const count = await this.saleRepo.count();

    return {
      data,
      page,
      count,
      pageSize,
    };
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

  async deleteSale(id: string) {
    await this.saleRepo.delete(id);

    return {
      message: "Sotuv o'chirildi",
    };
  }
}
