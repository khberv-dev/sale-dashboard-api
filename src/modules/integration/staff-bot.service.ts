import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot, CommandContext, Context } from 'grammy';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@shared/entities/user.entity';
import { Repository } from 'typeorm';
import dayjs from 'dayjs';
import { AmocrmService } from '@modules/integration/amocrm.service';
import { formatTime } from '@/utils/formatter.util';
import { SipuniService } from '@modules/integration/sipuni.service';
import { CALL_DURATION_REACH_BONUS_SUM, MINIMUM_CALL_DURATION_HOURS } from '@shared/constants';

@Injectable()
export class StaffBotService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly config: ConfigService,
    private readonly amocrmService: AmocrmService,
    private readonly sipuniService: SipuniService,
  ) {}

  private bot: Bot;

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

  private getManagerSaleResults(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return this.userRepo.query(
      `select count(*) as "saleCount", coalesce(sum(s.amount), 0) as "saleAmount"
       from sales s
       where manager_id = $1
         and s.sale_at between $2 and $3`,
      [userId, startDate, endDate],
    );
  }

  async sendDailyReports() {
    try {
      const startDate = dayjs().subtract(1, 'day').startOf('day');
      const endDate = startDate.add(1, 'day');
      const monthStartDate = dayjs().startOf('month');
      const monthEndDate = dayjs().endOf('month');
      const users = await this.userRepo.find({
        relations: ['crmProfile'],
      });

      for (const user of users) {
        if (!user.telegramId) continue;

        const crmProfile = user.crmProfile;
        const saleData = (await this.getManagerSaleResults(user.id, startDate.toDate(), endDate.toDate()))[0];
        const monthSaleData = (
          await this.getManagerSaleResults(user.id, monthStartDate.toDate(), monthEndDate.toDate())
        )[0];
        const leadCount = await this.amocrmService.getLeadsCount(
          crmProfile.accountId,
          startDate.toDate(),
          endDate.toDate(),
        );
        const callTimeData = await this.sipuniService.calculateCallDurations(startDate.toDate(), endDate.toDate());
        const callTime = callTimeData[crmProfile.sipNumber];
        // const postSalary =
        // const preSalary =

        const messageText =
          `<b><i>Bu natija — sizning mehnatingiz.\n` +
          `Bu mehnat pulga aylanyapti.</i></b>\n\n` +
          `💰 +${saleData.saleAmount} so'm so‘m\n\n` +
          `📈 <b>Oylik sotuv daromadi:</b>\n` +
          `${monthSaleData.saleAmount} so'm\n\n` +
          `🔵 KUN YAKUNI (FINAL HISOB)\n` +
          `📊 BUGUNGI KUN YAKUNI\n\n` +
          `📦 Sotuvlar: \n` +
          `${saleData.saleCount} ta → + ${saleData.saleAmount} so‘m\n\n` +
          `📞 Call time:\n` +
          `${formatTime(callTime ? callTime : 0)}\n` +
          `Bonus: ${callTime >= MINIMUM_CALL_DURATION_HOURS ? CALL_DURATION_REACH_BONUS_SUM : 0} so'm\n\n` +
          `Bugun ishlaganingiz —\n` +
          `ertangi daromadingiz.`;

        await this.bot.api.sendMessage(user.telegramId, messageText, {
          parse_mode: 'HTML',
        });
      }
    } catch (e) {
      console.log(e);
    }
  }
}
