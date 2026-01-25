import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { randomNumber } from '@/utils/randomize.util';
import Captcha from 'captchapng';

@Injectable()
export class CaptchaService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async generate() {
    const sessionId = randomNumber(10);
    const code = randomNumber(8);
    const captcha = new Captcha(80, 30, code);

    captcha.color(0, 0, 0, 255);
    captcha.color(200, 10, 20, 60);

    await this.cache.set(`session-${sessionId}`, code);

    return {
      session: sessionId,
      image: captcha.getBase64(),
    };
  }

  async validateSession(sessionId: number, captcha: number) {
    const code = await this.cache.get<number>(`session-${sessionId}`);

    if (!code) {
      throw new BadRequestException('Session not found');
    }

    if (code !== captcha) {
      throw new BadRequestException('Rasmdagi kod xato');
    }

    return true;
  }
}
