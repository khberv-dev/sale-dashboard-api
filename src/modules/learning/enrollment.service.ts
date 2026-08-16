import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { LearningService } from '@modules/integration/learning.service';
import { SaleService } from '@modules/sale/sale.service';
import { CreateEnrollmentRequest } from '@modules/learning/dto/create-enrollment-request.dto';
import { CreatePendingEnrollmentRequest } from '@modules/learning/dto/create-pending-enrollment-request.dto';

@Injectable()
export class EnrollmentService {
  private readonly logger = new Logger(EnrollmentService.name);

  constructor(
    private readonly learningService: LearningService,
    private readonly saleService: SaleService,
  ) {}

  /**
   * Menejer talabani o'quv platformasiga yozadi va shu yozilish shu yerda sotuv
   * sifatida qayd etiladi — menejerning reyting va oyligiga tushadi.
   *
   * Tartib muhim: avval platformada yozilish ochiladi, keyin sotuv yoziladi.
   * Teskarisi bo'lsa, yozilish xato bersa ham sotuv qolib ketardi.
   */
  async enroll(managerUserId: string, data: CreateEnrollmentRequest) {
    if (!data.planId && !data.courseId) {
      throw new BadRequestException("planId yoki courseId ko'rsatilishi shart");
    }

    const enrollment = await this.learningService.createEnrollment({
      studentId: data.studentId,
      planId: data.planId,
      courseId: data.courseId,
      amount: data.amount,
      start: data.start,
      end: data.end,
    });

    // Yozilish allaqachon ochilgan — uni orqaga qaytarib bo'lmaydi. Sotuv yozuvi
    // xato bersa ham so'rov muvaffaqiyatli tugaydi, aks holda menejer qayta
    // urinib, ikkinchi marta yozilish ochishga harakat qiladi.
    let saleRecorded = true;

    try {
      await this.saleService.recordSale(managerUserId, data.amount, new Date(), data.type, data.contractNumber);
    } catch (e) {
      saleRecorded = false;
      this.logger.error(
        `enrollment=${enrollment.id} created but sale not recorded for manager=${managerUserId}: ${e.message}`,
      );
    }

    return {
      message: saleRecorded ? 'Talaba kursga yozildi' : 'Talaba kursga yozildi, lekin sotuv qayd etilmadi',
      saleRecorded,
      enrollment,
    };
  }

  /**
   * `enroll` dan farqi: yozilish ochilmaydi, so'rov platforma adminining tasdig'ini
   * kutadi. Shuning uchun bu yerda sotuv **yozilmaydi** — summa hali ma'lum emas
   * (tarifni admin tanlaydi) va so'rov rad etilishi mumkin. Rad etilgan so'rov
   * uchun yozilgan sotuvni orqaga qaytarib bo'lmasdi.
   */
  async requestEnrollment(data: CreatePendingEnrollmentRequest) {
    const pending = await this.learningService.createPendingEnrollment(data);

    return {
      message: "So'rov yuborildi — admin tasdig'i kutilmoqda",
      pending,
    };
  }

  /** So'rov holatini kuzatish — `accepted` bo'lganda `enrollment` to'ladi. */
  getPendingEnrollment(id: string) {
    return this.learningService.getPendingEnrollment(id);
  }
}
