import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateSaleRequest {
  @IsInt()
  amount: number;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  contractId: string;

  @IsString()
  date: string;

  @IsString()
  time: string;
}
