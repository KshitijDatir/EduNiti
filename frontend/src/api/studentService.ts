import { apiClient } from './axiosConfig';
import type { StudentProfile, ExamResult, Session, UpcomingTest } from '../types';
import type { ApiResponse } from '../types';

const PROFILE = '/api/student/profile';
const RESULTS = '/api/student/results';
const SESSIONS = '/api/student/sessions';

function unwrap<T>(response: ApiResponse<T> | T): T {
  if (response !== null && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponse<T>).data;
  }
  return response as T;
}

export interface StudentServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getProfile(): Promise<StudentServiceResult<StudentProfile>> {
  try {
    const { data } = await apiClient.get<ApiResponse<StudentProfile> | StudentProfile>(PROFILE);
    return { success: true, data: unwrap(data) };
  } catch (err: unknown) {
    const message =
      err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Failed to load profile.';
    return { success: false, error: message || 'Failed to load profile.' };
  }
}

export async function getResults(): Promise<StudentServiceResult<ExamResult[]>> {
  try {
    const { data } = await apiClient.get<ApiResponse<ExamResult[]> | ExamResult[]>(RESULTS);
    const list = unwrap(data);
    return { success: true, data: Array.isArray(list) ? list : [] };
  } catch (err: unknown) {
    const message =
      err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Failed to load results.';
    return { success: false, error: message || 'Failed to load results.' };
  }
}

export async function getSessions(): Promise<StudentServiceResult<Session[]>> {
  try {
    const { data } = await apiClient.get<ApiResponse<Session[]> | Session[]>(SESSIONS);
    const list = unwrap(data);
    return { success: true, data: Array.isArray(list) ? list : [] };
  } catch (err: unknown) {
    const message =
      err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Failed to load sessions.';
    return { success: false, error: message || 'Failed to load sessions.' };
  }
}

// Upcoming tests - if backend exposes GET /api/student/upcoming-tests or similar, add here
const UPCOMING_TESTS = '/api/student/upcoming-tests';

export async function getUpcomingTests(): Promise<StudentServiceResult<UpcomingTest[]>> {
  try {
    const { data } = await apiClient.get<ApiResponse<UpcomingTest[]> | UpcomingTest[]>(UPCOMING_TESTS);
    const list = unwrap(data);
    return { success: true, data: Array.isArray(list) ? list : [] };
  } catch (err: unknown) {
    const message =
      err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Failed to load upcoming tests.';
    return { success: false, error: message || 'Failed to load upcoming tests.' };
  }
}
