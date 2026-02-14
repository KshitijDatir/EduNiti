import { apiClient, getApiBaseURL } from './axiosConfig';
import type { LoginCredentials, LoginResponse } from '../types';
import type { ApiResponse } from '../types';

const AUTH_LOGIN = '/api/auth/login';
const OAUTH_GOOGLE = '/api/auth/oauth/google';

export interface LoginServiceResult {
  success: boolean;
  data?: LoginResponse;
  error?: string;
}

export interface OAuthCallbackResult {
  success: boolean;
  token?: string;
  error?: string;
}

/**
 * Login with email and password. Returns JWT and user on success.
 */
export async function loginWithEmail(
  email: string,
  password: string
): Promise<LoginServiceResult> {
  const credentials: LoginCredentials = { email, password };
  try {
    const { data } = await apiClient.post<ApiResponse<LoginResponse> | LoginResponse>(
      AUTH_LOGIN,
      credentials
    );
    const payload =
      'data' in data ? (data as ApiResponse<LoginResponse>).data : (data as LoginResponse);
    return {
      success: true,
      data: {
        token: payload.token,
        user: payload.user,
      },
    };
  } catch (err: unknown) {
    const message =
      err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Login failed. Please try again.';
    return {
      success: false,
      error: message || 'Login failed. Please try again.',
    };
  }
}

/**
 * Redirects the browser to the backend Google OAuth entry point.
 * Backend will redirect to Google consent, then to its callback, then to frontend /oauth/callback?token=JWT
 */
export function initiateGoogleLogin(): void {
  const base = getApiBaseURL();
  const url = `${base}${OAUTH_GOOGLE}`;
  window.location.href = url;
}

/**
 * Validates the token from OAuth callback URL. Does not call the API.
 * Caller (e.g. AuthContext) should store the token after success.
 */
export function handleOAuthCallback(token: string | null): OAuthCallbackResult {
  const trimmed = typeof token === 'string' ? token.trim() : '';
  if (!trimmed) {
    return { success: false, error: 'Missing or invalid token.' };
  }
  return { success: true, token: trimmed };
}
