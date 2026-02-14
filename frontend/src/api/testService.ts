import { apiClient } from './axiosConfig';
import type { TestDetails, TestSubmitPayload } from '../types';
import type { ApiResponse } from '../types';

const SUBMIT = '/api/test/submit';

function unwrap<T>(response: ApiResponse<T> | T): T {
  if (response !== null && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponse<T>).data;
  }
  return response as T;
}

export interface SubmitTestResult {
  success: boolean;
  data?: { score?: number; message?: string };
  error?: string;
}

export async function submitTest(payload: TestSubmitPayload): Promise<SubmitTestResult> {
  try {
    const { data } = await apiClient.post<ApiResponse<{ score?: number; message?: string }> | { score?: number; message?: string }>(
      SUBMIT,
      payload
    );
    return { success: true, data: unwrap(data) };
  } catch (err: unknown) {
    const message =
      err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Submission failed. Please try again.';
    return { success: false, error: message || 'Submission failed. Please try again.' };
  }
}

// Optional: GET test details (e.g. GET /api/test/:testId) for TestPage
const TEST_DETAILS = (testId: string) => `/api/test/${testId}`;

export interface GetTestResult {
  success: boolean;
  data?: TestDetails;
  error?: string;
}

export async function getTestDetails(testId: string): Promise<GetTestResult> {
  try {
    const { data } = await apiClient.get<ApiResponse<TestDetails> | TestDetails>(TEST_DETAILS(testId));
    return { success: true, data: unwrap(data) };
  } catch (err: unknown) {
    const message =
      err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Failed to load test.';
    return { success: false, error: message || 'Failed to load test.' };
  }
}
