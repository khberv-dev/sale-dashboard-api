import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot, CommandContext, Context } from 'grammy';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@shared/entities/user.entity';
import { Repository } from 'typeorm';
import dayjs from 'dayjs';
import { formatNumber, formatTime } from '@/utils/formatter.util';
import { SipuniService } from '@modules/integration/sipuni.service';
import { CALL_DURATION_REACH_BONUS_SUM, MINIMUM_CALL_DURATION_HOURS } from '@shared/constants';
import { SalaryService } from '@shared/modules/stats/salary.service';
import { SalesService } from '@shared/modules/stats/sales.service';
import { CallsService } from '@shared/modules/stats/calls.service';

@Injectable()
export class StaffBotService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly config: ConfigService,
    private readonly sipuniService: SipuniService,
    private readonly salaryService: SalaryService,
    private readonly salesService: SalesService,
    private readonly callsService: CallsService,
  ) {}

  private bot: Bot;
  private logger = new Logger('Staff-bot service');

  onModuleInit() {
    this.bot = new Bot(this.config.getOrThrow<string>('STAFF_BOT_TOKEN'));

    this.bot.command('start', this.handleStartCommand);

    this.bot.start({ drop_pending_updates: true });
  }

  private handleStartCommand = async (context: CommandContext<Context>) => {
    const userId = context.message?.text?.split(' ')[1];
    const user = await this.userRepo.findOne({
      where: {
        id: userId,
      },
    });

    if (!user || !userId) {
      return await context.reply('❌ Biriktish uchun akkaunt topilmadi!');
    }

    if (user.telegramId === context.chat.id.toString()) {
      return await context.reply('✅ Akkaunt ulangan');
    }

    await this.userRepo.update(userId, {
      telegramId: context.chat.id.toString(),
    });

    await context.reply(
      `Assalomu Aleykum 😊\n\n\n` +
        `Sizda  o’zgarmas oylik to’liq oy uchun 1 mln\n` +
        `Oy davomida sizda yana quyidagi KPI  va unga bog’langan bonuslar bor\n\n` +
        `Call time uchun : 30 000 kunlik ( Kunlik 2.5 soat uchun )\n\n\n` +
        `Sizdan yuqori natija kutib qolamiz\n\n\n` +
        `Hurmat bilan iTeach rahbariyati`,
    );
  };

  async sendDailyReports() {
    const startDate = dayjs().subtract(1, 'day').startOf('day');
    const endDate = startDate.add(1, 'day');
    const monthStartDate = startDate.startOf('month');
    const monthEndDate = startDate.endOf('month');
    const users = await this.userRepo.find({
      relations: ['crmProfile'],
    });

    for (const user of users) {
      if (!user.telegramId || !user.crmProfile) continue;

      const crmProfile = user.crmProfile;
      const sale = await this.salesService.calculateManagerSale(user.id, startDate.toDate(), endDate.toDate());

      // const leadCount = await this.amocrmService.getLeadsCount(
      //   crmProfile.accountId,
      //   startDate.toDate(),
      //   endDate.toDate(),
      // );
      const extraDuration = await this.callsService.calculateManagerCallDuration(
        user.id,
        startDate.toDate(),
        endDate.toDate(),
      );
      const callTimeData = await this.sipuniService.calculateCallDurations(startDate.toDate(), endDate.toDate());
      const callTime = (callTimeData.get(crmProfile.sipNumber) || 0) + extraDuration;
      const preSalary = await this.salaryService.calculateSalary(user.id, monthStartDate.toDate(), startDate.toDate());
      const postSalary = await this.salaryService.calculateSalary(
        user.id,
        monthStartDate.toDate(),
        monthEndDate.toDate(),
      );

      const messageText =
        `<b><i>Bu natija — sizning mehnatingiz.\n` +
        `Bu mehnat pulga aylanyapti.</i></b>\n\n` +
        `💰 + ${formatNumber(postSalary - preSalary)} so'm so‘m\n\n` +
        `📈 <b>Oylik sotuv daromadi:</b>\n` +
        `${formatNumber(postSalary)} so'm\n\n` +
        `🔵 KUN YAKUNI (FINAL HISOB)\n` +
        `📊 BUGUNGI KUN YAKUNI\n\n` +
        `📦 Sotuvlar: \n` +
        `${sale.count} ta → + ${formatNumber(sale.amount)} so‘m\n\n` +
        `📞 Call time:\n` +
        `${formatTime(callTime ? callTime : 0)}\n` +
        `Bonus: ${formatNumber(callTime >= MINIMUM_CALL_DURATION_HOURS ? CALL_DURATION_REACH_BONUS_SUM : 0)} so'm\n\n` +
        `Bugun ishlaganingiz —\n` +
        `ertangi daromadingiz.`;

      try {
        await this.bot.api.sendMessage(user.telegramId, messageText, {
          parse_mode: 'HTML',
        });
      } catch (e) {
        this.logger.error(
          `Unable to send daily data to ${user.telegramId}(${user.firstName} ${user.lastName}). Error: ${e}`,
        );
      }
    }
  }
}
