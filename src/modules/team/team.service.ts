import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Team } from '@shared/entities/team.entity';
import { Repository } from 'typeorm';
import { CreateTeamRequest } from '@modules/team/dto/create-team-request.dto';

@Injectable()
export class TeamService {
  constructor(@InjectRepository(Team) private readonly teamRepo: Repository<Team>) {}

  getAll() {
    return this.teamRepo.find({ relations: ['members'] });
  }

  async create(data: CreateTeamRequest) {
    await this.teamRepo.save({
      name: data.name,
    });

    return {
      message: 'Guruh yaratildi',
    };
  }
}
