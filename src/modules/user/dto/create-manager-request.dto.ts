import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateManagerRequest {
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName: string;

  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(8)
  password: string;
}
