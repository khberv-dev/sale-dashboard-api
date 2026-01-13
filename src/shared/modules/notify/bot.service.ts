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
      const message = context.message;

      await this.bot.api.forwardMessage('-5010331073', this.groupId, message.message_id);
    });

    this.bot.start({
      drop_pending_updates: false,
    });
  }

  notifySale(firstName: string, lastName: string, amount: number) {
    const fullName = firstName + ' ' + (lastName ? lastName : '');
    const messageText =
      '<b>Sotuv 🚀</>\n\n' + `<b>👤 Sotuvchi: </b>${fullName}\n` + `<b>💸 Summa: </b>${formatNumber(amount)}`;

    return this.bot.api.sendMessage(this.groupId, messageText, {
      parse_mode: 'HTML',
    });
  }
}
