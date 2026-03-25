import { Body, Controller, Get, Post } from '@nestjs/common';
import { TeamService } from '@modules/team/team.service';
import { CreateTeamRequest } from '@modules/team/dto/create-team-request.dto';

@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  get() {
    return this.teamService.getAll();
  }

  @Post('create')
  create(@Body() body: CreateTeamRequest) {
    return this.teamService.create(body);
  }
}
