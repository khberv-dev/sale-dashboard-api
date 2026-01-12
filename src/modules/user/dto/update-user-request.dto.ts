import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserRequest {
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName: string;

  @IsString()
  @MinLength(3)
  username: string;

  @IsOptional()
  @IsString()
  password: string;
}
