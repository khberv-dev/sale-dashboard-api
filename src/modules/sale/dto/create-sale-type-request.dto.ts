import { IsString } from 'class-validator';

export class CreateSaleTypeRequest {
  @IsString()
  name: string;
}
