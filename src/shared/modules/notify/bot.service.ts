import { Injectable, OnModuleInit } from '@nestjs/common';
import { Bot } from 'grammy';
import { ConfigService } from '@nestjs/config';
import { formatNumber, formatTime } from '@/utils/formatter.util';

@Injectable()
export class BotService implements OnModuleInit {
  groupId: string;

  constructor(private readonly configService: ConfigService) {
    this.groupId = this.configService.getOrThrow<string>('GROUP_ID');
  }

  bot: Bot;
  staffBot: Bot;

  onModuleInit() {
    this.bot = new Bot(this.configService.getOrThrow<string>('BOT_TOKEN'));
    this.staffBot = new Bot(this.configService.getOrThrow<string>('STAFF_BOT_TOKEN'));

    this.bot.on('message', async (context) => {
      try {
        const message = context.message;

        await this.bot.api.forwardMessage('-5010331073', this.groupId, message.message_id);
      } catch (e) {
        console.log('Unable to forward');
      }
    });

    this.bot.start({
      drop_pending_updates: false,
    });
  }

  notifySale(
    firstName: string,
    lastName: string,
    amount: number,
    dailyAmount: number,
    monthlyAmount: number,
    type: string,
    managerTelegramId: string | null,
  ) {
    const fullName = firstName + ' ' + (lastName ? lastName : '');
    const messageText =
      '<b>💵 SOTUV ❗️❗️❗️</>\n' +
      '━━━━━━━━━━━━━━\n' +
      `👤<b>${fullName}</b>\n` +
      `💰${formatNumber(amount)} so'm\n` +
      `📃 <b>${type}</b>\n` +
      `📈<b>Bugun:</b> ${formatNumber(dailyAmount)}\n` +
      `🗓<b>Oy:</b> ${formatNumber(monthlyAmount)}\n` +
      '━━━━━━━━━━━━━━\n' +
      '📌 Keyingisi kim?';

    if (managerTelegramId) {
      this.staffBot.api.sendMessage(managerTelegramId, messageText, {
        parse_mode: 'HTML',
      });
    }
    this.bot.api.sendMessage(this.groupId, messageText, {
      parse_mode: 'HTML',
    });
  }

  notifyCallBonus(managerTelegramId: string, duration: number) {
    const messageText =
      `📞 <b>CALL TIME NATIJA</b>\n\n` +
      `⏱ Call time: ${formatTime(duration)}\n\n` +
      `Siz 3 soatlik chegaradan o‘tdingiz.\n\n` +
      `💰 Bonus AKTIV:\n` +
      `+30 000 so'm\n\n` +
      `Bu intizom.\n` +
      `Bu — yuqori oylik.`;

    this.staffBot.api.sendMessage(managerTelegramId, messageText, {
      parse_mode: 'HTML',
    });
  }
}
