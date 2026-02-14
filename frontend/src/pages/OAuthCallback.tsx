import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleOAuthCallback } from '../api/authService';
import { useAuth } from '../context/AuthContext';
import { Loader } from '../components/Loader';

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithOAuthToken } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const token = searchParams.get('token');
    const result = handleOAuthCallback(token);

    if (result.success && result.token) {
      loginWithOAuthToken(result.token);
      setStatus('success');
      navigate('/dashboard', { replace: true });
    } else {
      setStatus('error');
      setErrorMessage(result.error ?? 'Authentication failed.');
    }
  }, [searchParams, loginWithOAuthToken, navigate]);

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-8 shadow-lg">
          <h2 className="text-lg font-semibold text-red-800">Sign-in failed</h2>
          <p className="mt-2 text-sm text-surface-700">{errorMessage}</p>
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="mt-6 w-full rounded-lg bg-primary-600 px-4 py-3 font-medium text-white hover:bg-primary-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4">
      <div className="flex flex-col items-center gap-4">
        <Loader size="lg" />
        <p className="text-sm text-surface-600">Completing sign-in...</p>
      </div>
    </div>
  );
}
