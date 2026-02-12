import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SalaryBonus } from '@shared/entities/salary-bonus.entity';
import { Between, Repository } from 'typeorm';
import { SalesService } from '@shared/modules/stats/sales.service';

@Injectable()
export class SalaryService {
  constructor(
    @InjectRepository(SalaryBonus) private readonly salaryBonusRepo: Repository<SalaryBonus>,
    private readonly salesService: SalesService,
  ) {}

  async calculateSalary(managerUserId: string, startDate: Date, endDate: Date) {
    const fixedSalaryAmount = 1_000_000;
    const { amount: saleAmount } = await this.salesService.calculateManagerSale(managerUserId, startDate, endDate);
    let saleBonus = 0;
    let salaryBonus = 0;

    switch (true) {
      case saleAmount > 50_000_000:
        saleBonus = saleAmount * 0.1;
        break;
      case saleAmount > 40_000_000:
        saleBonus = saleAmount * 0.09;
        break;
      case saleAmount > 30_000_000:
        saleBonus = saleAmount * 0.07;
        break;
      case saleAmount > 20_000_000:
        saleBonus = saleAmount * 0.05;
        break;
      case saleAmount > 10_000_000:
        saleBonus = saleAmount * 0.03;
        break;
    }

    const salaryBonuses = await this.salaryBonusRepo.find({
      where: {
        user: { id: managerUserId },
        date: Between(startDate, endDate),
      },
    });

    salaryBonuses.forEach((bonus) => (salaryBonus += bonus.amount));

    return Math.floor(fixedSalaryAmount + saleBonus + salaryBonus);
  }
}
