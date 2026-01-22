import { IsString } from 'class-validator';

export class UpdatePasswordRequest {
  @IsString()
  oldPassword: string;

  @IsString()
  password: string;

  @IsString()
  passwordConfirm: string;
}
