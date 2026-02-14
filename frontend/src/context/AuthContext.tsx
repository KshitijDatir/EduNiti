import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';
import { loginWithEmail as loginWithEmailApi } from '../api/authService';
import { setTokenGetter } from '../api/axiosConfig';
import type { AuthUser } from '../types';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithOAuthToken: (token: string) => void;
  logout: () => void;
  setAuth: (token: string, user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const OAUTH_PLACEHOLDER_USER: AuthUser = {
  id: 'oauth',
  email: '',
  name: 'Student',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isAuthenticated: false,
  });

  setTokenGetter(() => state.token);

  const setAuth = useCallback((token: string, user: AuthUser) => {
    setState({ token, user, isAuthenticated: true });
  }, []);

  const logout = useCallback(() => {
    setState({ token: null, user: null, isAuthenticated: false });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginWithEmailApi(email, password);
    if (result.success && result.data) {
      setState({
        token: result.data.token,
        user: result.data.user,
        isAuthenticated: true,
      });
      return { success: true };
    }
    return { success: false, error: result.error };
  }, []);

  const loginWithOAuthToken = useCallback((token: string) => {
    setState({
      token,
      user: OAUTH_PLACEHOLDER_USER,
      isAuthenticated: true,
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      loginWithOAuthToken,
      logout,
      setAuth,
    }),
    [state, login, loginWithOAuthToken, logout, setAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
