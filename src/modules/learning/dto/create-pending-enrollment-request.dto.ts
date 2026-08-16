import { IsDateString, IsOptional, IsUUID } from 'class-validator';

/**
 * Admin tasdig'ini kutadigan yozilish so'rovi. Tarif (`planId`) va summa bu yerda
 * so'ralmaydi — ularni platforma admini tasdiqlash paytida tanlaydi.
 */
export class CreatePendingEnrollmentRequest {
  /** `/api/learning/students` javobidagi `userId` — `studentId` emas. */
  @IsUUID()
  userId: string;

  @IsUUID()
  courseId: string;

  /** Berilmasa — tasdiqlangan payt. */
  @IsOptional()
  @IsDateString()
  start?: string;

  /** Berilmasa — boshlanish sanasiga admin tanlagan tarifdagi oylar qo'shiladi. */
  @IsOptional()
  @IsDateString()
  end?: string;
}
