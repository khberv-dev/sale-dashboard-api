import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AmocrmService } from '@modules/integration/amocrm.service';
import { SipuniService } from '@modules/integration/sipuni.service';
import { StaffBotService } from '@modules/integration/staff-bot.service';

@Injectable()
export class SynchronizeService {
  constructor(
    private readonly amoCrmService: AmocrmService,
    private readonly sipuniService: SipuniService,
    private readonly staffBotService: StaffBotService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncLeadCountCron() {
    await this.amoCrmService.syncLeadCount();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async syncDailyCallDurationCron() {
    await this.sipuniService.syncDailyCallDuration();
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendDailyReportsCron() {
    await this.staffBotService.sendDailyReports();
  }
}
