import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
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

  @Cron(process.env.CRON_LEAD_COUNT_SYNC as string)
  syncLeadCountCron() {
    this.amoCrmService.syncLeadCount();
  }

  @Cron(process.env.CRON_LEAD_COUNT_SYNC as string)
  syncDailyCallDurationCron() {
    this.sipuniService.syncDailyCallDuration();
  }

  @Cron(process.env.CRON_LEAD_COUNT_SYNC as string)
  sendDailyReportsCron() {
    this.staffBotService.sendDailyReports();
  }
}
