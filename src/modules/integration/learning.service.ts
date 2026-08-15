import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, isAxiosError } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { LearningCourse, LearningEnrollment, LearningStudentPage } from '@shared/dto/learning-platform.dto';

/**
 * Learning platform'ning tashqi API mijozi (`/api/external/*`).
 * Autentifikatsiya JWT emas — har bir so'rovda `X-Auth` sarlavhasidagi umumiy kalit.
 */
@Injectable()
export class LearningService {
  private readonly logger = new Logger('Learning platform');
  private client: AxiosInstance | null = null;

  constructor(private readonly config: ConfigService) {}

  /**
   * Mijoz birinchi so'rovda yaratiladi — sozlamalar yo'q bo'lsa faqat shu
   * endpointlar ishlamaydi, butun ilova ishga tushmay qolmaydi.
   */
  private apiClient(): AxiosInstance {
    if (this.client) {
      return this.client;
    }

    const baseURL = this.config.get<string>('LEARNING_API_URL');
    const apiKey = this.config.get<string>('LEARNING_API_KEY');

    if (!baseURL || !apiKey) {
      this.logger.error(
        "LEARNING_API_URL yoki LEARNING_API_KEY sozlanmagan — o'quv platformasi so'rovlari rad etiladi",
      );
      throw new ServiceUnavailableException("O'quv platformasi integratsiyasi sozlanmagan");
    }

    const proxyUrl = this.config.get<string>('PROXY_URL');

    this.client = axios.create({
      baseURL,
      timeout: 15_000,
      headers: { 'X-Auth': apiKey },
      ...(proxyUrl && { httpsAgent: new HttpsProxyAgent(proxyUrl) }),
    });

    return this.client;
  }

  searchStudents(query: { phone: string; page: number; limit: number }) {
    return this.request(() =>
      this.apiClient().get<LearningStudentPage>('external/students', {
        params: { phone: query.phone, page: query.page, limit: query.limit },
      }),
    );
  }

  listCourses() {
    return this.request(() => this.apiClient().get<LearningCourse[]>('external/courses'));
  }

  createEnrollment(body: {
    studentId: string;
    planId?: string;
    courseId?: string;
    amount: number;
    start?: string;
    end?: string;
  }) {
    return this.request(() => this.apiClient().post<LearningEnrollment>('external/enrollments', body));
  }

  /**
   * Platformaning o'z xatosini (400/404 va uning o'zbekcha xabari) menejerga
   * o'zgartirmasdan yetkazadi. Tarmoq yoki 5xx xatolari umumiy xabarga aylanadi —
   * tashqi xizmatning ichki tafsilotlari mijozga chiqmasligi uchun.
   */
  private async request<T>(call: () => Promise<{ data: T }>): Promise<T> {
    try {
      const res = await call();
      return res.data;
    } catch (e) {
      // Sozlama yo'qligi kabi o'z xatolarimiz o'zgarishsiz o'tadi.
      if (e instanceof HttpException) {
        throw e;
      }

      if (!isAxiosError(e)) {
        this.logger.error(`unexpected error: ${e}`);
        throw new InternalServerErrorException("O'quv platformasi bilan bog'lanib bo'lmadi");
      }

      const status = e.response?.status;
      const message = e.response?.data?.message;

      this.logger.error(`${e.config?.method?.toUpperCase()} ${e.config?.url} failed: ${status ?? e.code} ${message}`);

      if (status && status >= 400 && status < 500 && message) {
        throw new HttpException(message, status);
      }

      throw new InternalServerErrorException("O'quv platformasi bilan bog'lanib bo'lmadi");
    }
  }
}
