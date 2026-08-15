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
