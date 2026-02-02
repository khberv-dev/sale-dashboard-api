import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot, CommandContext, Context } from 'grammy';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@shared/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StaffBotService implements OnModuleInit {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
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
      return await context.reply('✅ Akkunt ulangan');
    }

    await this.userRepo.update(userId, {
      telegramId: context.chat.id.toString(),
    });

    await context.reply('✅ Akkunt ulandi');
  };
}
