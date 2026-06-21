import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateSaleTypeRequest {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isResale?: boolean;
}
