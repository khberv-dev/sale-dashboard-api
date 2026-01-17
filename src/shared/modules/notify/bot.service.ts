import { Injectable, OnModuleInit } from '@nestjs/common';
import { Bot } from 'grammy';
import { ConfigService } from '@nestjs/config';
import { formatNumber } from '@/utils/formatter.util';

@Injectable()
export class BotService implements OnModuleInit {
  groupId: string;

  constructor(private readonly configService: ConfigService) {
    this.groupId = this.configService.getOrThrow<string>('GROUP_ID');
  }

  bot: Bot;

  onModuleInit() {
    this.bot = new Bot(this.configService.getOrThrow<string>('BOT_TOKEN'));

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

  notifySale(firstName: string, lastName: string, amount: number, dailyAmount: number, monthlyAmount: number) {
    const fullName = firstName + ' ' + (lastName ? lastName : '');
    const messageText =
      '<b>💵 SOTUV ❗️❗️❗️</>\n' +
      '━━━━━━━━━━━━━━\n' +
      `👤<b>${fullName}</b>\n` +
      `💰${formatNumber(amount)} so'm\n` +
      `📈<b>Bugun:</b> ${formatNumber(dailyAmount)}\n` +
      `🗓<b>Oy:</b> ${formatNumber(monthlyAmount)}\n` +
      '━━━━━━━━━━━━━━\n' +
      '📌 Keyingisi kim?';

    return this.bot.api.sendMessage(this.groupId, messageText, {
      parse_mode: 'HTML',
    });
  }
}
