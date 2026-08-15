import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Max, Min, MinLength } from 'class-validator';

export class SearchStudentsRequest {
  @Matches(/^\d+$/, { message: "Qidiruv faqat raqamlardan iborat bo'lishi kerak" })
  @MinLength(4, { message: 'Qidiruv uchun kamida 4 ta raqam kerak' })
  phone: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}
