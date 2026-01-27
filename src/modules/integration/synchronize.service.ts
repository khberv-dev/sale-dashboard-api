import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CrmProfile } from '@shared/entities/crm-profiles.entity';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AmocrmService } from '@modules/integration/amocrm.service';

@Injectable()
export class SynchronizeService {
  constructor(
    @InjectRepository(CrmProfile) private readonly crmProfileRepo: Repository<CrmProfile>,
    private readonly amoCrmService: AmocrmService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async syncLeadCount() {
    try {
      const accounts = await this.crmProfileRepo.find();

      for (const account of accounts) {
        const leadCount = await this.amoCrmService.getLeadsCount(account.accountId);

        await this.crmProfileRepo.save({
          ...account,
          leadCount,
        });
      }
    } catch (e) {
      console.log('Error counting leads:', e);
    }
  }
}
