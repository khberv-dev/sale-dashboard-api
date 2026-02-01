import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CrmProfile } from '@shared/entities/crm-profiles.entity';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AmocrmService } from '@modules/integration/amocrm.service';
import { SipuniService } from '@modules/integration/sipuni.service';

@Injectable()
export class SynchronizeService {
  constructor(
    @InjectRepository(CrmProfile) private readonly crmProfileRepo: Repository<CrmProfile>,
    private readonly amoCrmService: AmocrmService,
    private readonly sipuniService: SipuniService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
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

  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncCallDuration() {
    try {
      const callData = await this.sipuniService.calculateCallDurations();
      const accounts = await this.crmProfileRepo.find();

      for (const account of accounts) {
        if (account.sipNumber) {
          await this.crmProfileRepo.save({
            ...account,
            callDuration: callData.get(account.sipNumber),
          });
        }
      }
    } catch (e) {
      console.log('Error calculating call durations:', e);
    }
  }
}
