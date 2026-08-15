import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateEnrollmentRequest {
  @IsUUID()
  studentId: string;

  /** Tarif id — kurs va muddat shundan olinadi. */
  @IsOptional()
  @IsUUID()
  planId?: string;

  /** `planId` berilmasa majburiy; u holda `end` ham kerak. */
  @IsOptional()
  @IsUUID()
  courseId?: string;

  /** To'langan summa — yozilish tarixiga va shu yerdagi sotuvga yoziladi. */
  @IsInt()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsDateString()
  start?: string;

  @IsOptional()
  @IsDateString()
  end?: string;

  /** Sotuv turi (`/api/sale/type-options`) — sotuv yozuvida ishlatiladi. */
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  contractNumber?: string;
}
