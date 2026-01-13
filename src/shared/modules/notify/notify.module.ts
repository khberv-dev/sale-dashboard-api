import { Module } from '@nestjs/common';
import { BotService } from '@shared/modules/notify/bot.service';

@Module({
  providers: [BotService],
  exports: [BotService],
})
export class NotifyModule {}
