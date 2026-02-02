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

    await context.reply('✅ Akkaunt ulandi');
  };

  private getManagerDailySaleResults(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return this.userRepo.query(
      `select count(*) as "saleCount", sum(s.amount) as "saleAmount"
       from sales s
       where manager_id = $1 and s.sale_at between $2 and $3`,
      [userId, startDate, endDate],
    );
  }

  async sendDailyReports() {
    try {
      const startDate = dayjs().subtract(1, 'day').startOf('day');
      const endDate = startDate.add(1, 'day');
      const users = await this.userRepo.find({
        relations: ['crmProfile'],
      });

      for (const user of users) {
        if (!user.telegramId) continue;

        const crmProfile = user.crmProfile;
        const saleData = (await this.getManagerDailySaleResults(user.id, startDate.toDate(), endDate.toDate()))[0];
        const leadCount = await this.amocrmService.getLeadsCount(
          crmProfile.accountId,
          startDate.toDate(),
          endDate.toDate(),
        );
        const callTimeData = await this.sipuniService.calculateCallDurations(startDate.toDate(), endDate.toDate());
        const callTime = callTimeData[crmProfile.sipNumber];

        const messageText =
          `🗓 <b>${startDate.format('DD.MM.YYYY')}</b>\n\n` +
          `🪙 <b>Sotuvlar: </b>${saleData.saleCount} ta\n` +
          `💰 <b>Sotuv miqdori: </b>${saleData.saleAmount ? saleData.saleAmount : 0} so'm\n` +
          `📲 <b>Lidlar soni: </b>${leadCount} ta\n` +
          `📞 <b>Calltime: </b>${formatTime(callTime ? callTime : 0)}`;

        await this.bot.api.sendMessage(user.telegramId, messageText, {
          parse_mode: 'HTML',
        });
      }
    } catch (e) {
      console.log(e);
    }
  }
}
