import { IsInt, IsString } from 'class-validator';

export class AddCallRequest {
  @IsString()
  userId: string;

  @IsInt()
  duration: number;
}
