import { IsString } from 'class-validator';

export class SignInRequest {
  @IsString()
  username: string;

  @IsString()
  password: string;
}
