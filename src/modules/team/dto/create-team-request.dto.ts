import { IsString } from 'class-validator';

export class CreateTeamRequest {
  @IsString()
  name: string;
}
