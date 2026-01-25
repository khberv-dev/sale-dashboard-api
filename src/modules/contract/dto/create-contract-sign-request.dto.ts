import { IsInt, IsString } from 'class-validator';

export class CreateContractSignRequest {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  phoneNumber: string;

  @IsInt()
  session: number;

  @IsInt()
  captcha: number;
}
