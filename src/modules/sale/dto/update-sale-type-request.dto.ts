import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateSaleTypeRequest {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isActive: boolean;
}
