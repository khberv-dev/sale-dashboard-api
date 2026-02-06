import { IsString } from 'class-validator';

export class RegisterAttendanceRequest {
  @IsString()
  userId: string;
}
