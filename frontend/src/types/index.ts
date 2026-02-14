// Auth
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

// Student
export interface StudentProfile {
  id: string;
  name: string;
  email: string;
}

export interface ExamResult {
  id: string;
  testTitle: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
}

export interface Session {
  id: string;
  testTitle?: string;
  startedAt: string;
  status: 'active' | 'inactive' | 'completed';
}

export interface UpcomingTest {
  id: string;
  title: string;
  scheduledAt: string;
}

// Test
export interface TestQuestion {
  id: string;
  questionText: string;
  options: { id: string; text: string }[];
}

export interface TestDetails {
  id: string;
  title: string;
  questions: TestQuestion[];
}

export interface TestSubmitAnswer {
  questionId: string;
  selectedOption: string;
}

export interface TestSubmitPayload {
  testId: string;
  answers: TestSubmitAnswer[];
}

// API response wrapper (backend-team friendly)
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}
