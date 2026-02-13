import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Call } from '@shared/entities/call.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CallsService {
  constructor(@InjectRepository(Call) private readonly callRepo: Repository<Call>) {}

  async calculateManagerCallDuration(managerUserId: string, startDate: Date, endDate: Date) {
    const [result] = await this.callRepo.query(
      `select sum(c.duration) as duration
                                                from calls c
                                                where user_id = $1
                                                  and created_at between $2 and $3`,
      [managerUserId, startDate, endDate],
    );

    return result['duration'] as number;
  }
}
