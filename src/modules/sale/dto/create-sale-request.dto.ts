import { IsInt, IsString } from 'class-validator';

export class CreateSaleRequest {
  @IsInt()
  amount: number;

  @IsString()
  type: string;

  @IsString()
  date: string;

  @IsString()
  time: string;
}
