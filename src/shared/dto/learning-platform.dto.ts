export interface LearningStudent {
  studentId: string;
  userId: string;
  firstName: string;
  lastName: string | null;
  phoneNumber: string;
  level: string;
}

export interface LearningStudentPage {
  data: LearningStudent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LearningPlan {
  id: string;
  title: string;
  price: number;
  month: number;
  hasMentor: boolean;
}

export interface LearningCourse {
  id: string;
  title: string;
  description: string | null;
  plans: LearningPlan[];
}

export interface LearningEnrollment {
  id: string;
  status: string;
  start: string;
  end: string;
  course: {
    id: string;
    title: string;
  };
}

/** `created` — admin tasdig'i kutilmoqda, `accepted` — yozilish ochilgan, `rejected` — rad etilgan. */
export type LearningPendingStatus = 'created' | 'accepted' | 'rejected';

/**
 * Admin tasdig'ini kutayotgan yozilish so'rovi. Tarif (`plan`) bu yerda yo'q —
 * narx va muddat tasdiqlash paytida ma'lum bo'ladi, shuning uchun uni admin tanlaydi.
 */
export interface LearningPendingEnrollment {
  id: string;
  status: LearningPendingStatus;
  start: string | null;
  end: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string | null;
  };
  course: {
    id: string;
    title: string;
  };
  /** Faqat `accepted` holatida to'ladi. */
  enrollment: LearningEnrollment | null;
}
