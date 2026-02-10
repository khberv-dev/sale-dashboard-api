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
  syncLeadCountCron() {
    this.amoCrmService.syncLeadCount();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  syncDailyCallDurationCron() {
    this.sipuniService.syncDailyCallDuration();
  }

  @Cron('0 20 11 * * *')
  sendDailyReportsCron() {
    console.log('sending');
    this.staffBotService.sendDailyReports();
  }
}
