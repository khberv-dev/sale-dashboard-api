import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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
import { SalaryService } from '@shared/modules/stats/salary.service';
import { SalesService } from '@shared/modules/stats/sales.service';
import { AmocrmService } from '@modules/integration/amocrm.service';
import { CrmProfile } from '@shared/entities/crm-profiles.entity';
import { PlanHistory } from '@shared/entities/plan-history.entity';
import { Team } from '@shared/entities/team.entity';

@Injectable()
export class SaleService {
  private readonly logger = new Logger(SaleService.name);

  constructor(
    @InjectRepository(Sale) private readonly saleRepo: Repository<Sale>,
    @InjectRepository(SaleType) private readonly saleTypeRepo: Repository<SaleType>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(CrmProfile) private readonly crmProfileRepo: Repository<CrmProfile>,
    @InjectRepository(PlanHistory) private readonly planHistoryRepo: Repository<PlanHistory>,
    @InjectRepository(Team) private readonly teamRepo: Repository<Team>,
    private readonly eventGateway: EventGateway,
    private readonly botService: BotService,
    private readonly salaryService: SalaryService,
    private readonly salesService: SalesService,
    private readonly amocrmService: AmocrmService,
  ) {}

  async whCreate(body: any) {
    const statuses: any[] = body?.leads?.status ?? [];

    for (const status of statuses) {
      const leadId: string = status?.id;
      const statusId: string = status?.status_id;

      this.logger.log(`wh-create lead=${leadId} status=${statusId}`);

      if (statusId !== '142') continue;

      try {
        const lead = await this.amocrmService.getLead(leadId);
        this.logger.log(`fetched lead=${lead.id} price=${lead.price} responsible=${lead.responsible_user_id}`);

        const crmProfile = await this.crmProfileRepo.findOne({
          where: { accountId: String(lead.responsible_user_id) },
          relations: ['user'],
        });

        if (!crmProfile?.user) {
          this.logger.warn(`no manager found for responsible_user_id=${lead.responsible_user_id}`);
          continue;
        }

        await this.persistAndBroadcast(
          crmProfile.user.id,
          crmProfile.user.telegramId,
          lead.price ?? 0,
          dayjs.unix(lead.created_at).toDate(),
        );

        this.logger.log(`sale created for manager=${crmProfile.user.id} lead=${lead.id}`);
      } catch (e) {
        this.logger.error(`wh-create error for lead=${leadId}: ${e.message}`);
      }
    }
  }

  private async getAdminPlan() {
    const admin = await this.userRepo.findOne({
      where: {
        role: UserRole.ADMIN,
      },
    });

    if (!admin) {
      throw new BadRequestException('Admin not found');
    }

    const lastPlan = await this.planHistoryRepo.findOne({
      where: {
        user: { id: admin.id },
      },
      order: {
        date: 'DESC',
      },
    });

    return lastPlan?.plan ?? 0;
  }

  private async persistAndBroadcast(
    managerId: string,
    telegramId: string | null,
    amount: number,
    saleAt: Date,
    typeId?: string,
    contractNumber?: string,
  ) {
    const startDate = dayjs().startOf('month').toDate();
    const endDate = dayjs().endOf('month').toDate();

    const oldStats = await this.getStats({ startDate, endDate, byTeam: false }, null);

    const newSale = await this.saleRepo.save({
      manager: { id: managerId },
      amount,
      contractNumber,
      ...(typeId && { type: { id: typeId } }),
      saleAt,
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

    const stats = await this.getStats({ startDate, endDate, byTeam: false }, null);
    const is100MPassed =
      Math.floor(stats.totalAmount / 100_000_000) - Math.floor(oldStats.totalAmount / 100_000_000) > 0;

    this.eventGateway.broadcast('new-sale', { ...newSaleData, is100MPassed });
    this.botService.notifySale(
      newSaleData.firstName,
      newSaleData.lastName,
      newSaleData.amount,
      stats.dailyAmount,
      stats.totalAmount,
      newSaleData.type,
      telegramId,
    );
  }

  async createSale(managerUserId: string, data: CreateSaleRequest) {
    const managerUser = await this.userRepo.findOne({ where: { id: managerUserId } });

    if (!managerUser) {
      throw new BadRequestException();
    }

    const saleAt = dayjs(data.date + ' ' + data.time, 'YYYY-MM-DD HH:mm').toDate();
    await this.persistAndBroadcast(managerUserId, managerUser.telegramId, data.amount, saleAt, data.type, data.contractNumber);

    return {
      message: 'Sotuv tasdiqlandi',
    };
  }

  async createSaleType(data: CreateSaleTypeRequest) {
    await this.saleTypeRepo.save({
      name: data.name,
      isResale: data.isResale ?? false,
    });

    return {
      message: 'Sotuv turi yaratildi',
    };
  }

  private async getManagersResult(startDate: Date, endDate: Date, teamId: string | null = null): Promise<any[]> {
    const teamCondition = teamId ? `AND m.team_id = $3` : '';
    const params = teamId ? [startDate, endDate, teamId] : [startDate, endDate];

    const result = await this.saleRepo.query(
      `SELECT m.id,
              m.first_name               AS "firstName",
              m.last_name                AS "lastName",
              m.avatar,
              (SELECT ph.plan FROM "plan-histories" ph WHERE ph.user_id = m.id ORDER BY ph.date DESC LIMIT 1) AS plan,
              COALESCE(SUM(s.amount), 0) AS "sale",
              COUNT(s.id)                AS "saleCount",
              cp.lead_count              AS "leadCount",
              cp.call_duration           AS "callDuration"
       FROM users m
              LEFT JOIN sales s
                        ON s.manager_id = m.id
                          AND s.sale_at BETWEEN $1 AND $2
              LEFT JOIN "crm-profiles" cp
                        ON cp.user_id = m.id
       WHERE m.role = 'MANAGER'
         ${teamCondition}
       GROUP BY m.id,
         m.first_name,
         m.last_name,
         m.avatar,
         cp.lead_count,
         cp.call_duration
       ORDER BY "sale" DESC;
      `,
      params,
    );

    return Promise.all(
      result.map(async (manager) => {
        const salary = await this.salaryService.calculateSalary(manager.id, startDate, endDate);
        return { ...manager, salary };
      }),
    );
  }

  private async getDailyStat(teamId: string | null = null) {
    const startDate = dayjs().startOf('month').format('YYYY-MM-DD');
    const endDate = dayjs().endOf('month').format('YYYY-MM-DD HH:mm:ss');

    const teamCondition = teamId
      ? `AND EXISTS (SELECT 1 FROM users u WHERE u.id = s.manager_id AND u.team_id = $3)`
      : '';
    const params = teamId ? [startDate, endDate, teamId] : [startDate, endDate];

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
                       ${teamCondition}
    GROUP BY d.day
    ORDER BY d.day;`,
      params,
    );

    return data.map((x) => Number(x.sale));
  }

  private async getMonthlyStat(teamId: string | null = null) {
    const startDate = dayjs().subtract(6, 'month').format('YYYY-MM-DD');
    const endDate = dayjs().format('YYYY-MM-DD');

    const teamCondition = teamId
      ? `AND EXISTS (SELECT 1 FROM users u WHERE u.id = s.manager_id AND u.team_id = $3)`
      : '';
    const params = teamId ? [startDate, endDate, teamId] : [startDate, endDate];

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
                       ${teamCondition}
    GROUP BY m.month
    ORDER BY m.month;`,
      params,
    );

    return data.map((x) => Number(x.sale));
  }

  async getStats(filter: GetStatsFilter, userId: string | null) {
    let teamId: string | null = null;

    if (filter.byTeam && userId) {
      const user = await this.userRepo.findOne({
        where: {
          id: userId,
        },
        relations: ['team'],
      });

      if (user?.team) {
        teamId = user?.team.id ?? null;
      }
    }

    const now = dayjs();
    const startOfDay = now.startOf('day').toDate();
    const endOfDay = now.endOf('day').toDate();
    const dailyResult: any[] = await this.getManagersResult(startOfDay, endOfDay, teamId);
    const totalResult: any[] = await this.getManagersResult(filter.startDate, filter.endDate, teamId);
    const dailyStats = await this.getDailyStat(teamId);
    const monthlyStats = await this.getMonthlyStat(teamId);
    let monthPlan = await this.getAdminPlan();

    if (teamId) {
      const teamsCount = await this.teamRepo.count();

      if (teamsCount > 0) {
        monthPlan = monthPlan / teamsCount;
      }
    }

    const totalSalesCount = await this.salesService.calculateSalesCount(filter.startDate, filter.endDate);
    const totaLeadsCount = await this.salesService.getTotalLeadsCount();
    const saleRate = totaLeadsCount > 0 ? ((totalSalesCount / totaLeadsCount) * 100).toFixed(2) + '%' : '-';
    const totalSaleAmount = await this.salesService.calculateResaleSaleAmount(filter.startDate, filter.endDate);

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
      totalSaleAmount,
      monthPlan,
      saleRate,
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
