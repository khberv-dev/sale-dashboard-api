import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { UserPosition } from '@shared/enum/user-position.enum';

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

  @IsOptional()
  crmAccount: string;

  @IsOptional()
  sipNumber: string;

  @IsOptional()
  @IsInt()
  plan: number;

  @IsOptional()
  @IsEnum(UserPosition)
  position: UserPosition;

  @IsOptional()
  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @IsUUID()
  teamId: string;
}
