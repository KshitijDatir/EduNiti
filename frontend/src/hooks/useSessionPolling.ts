import { useEffect, useRef, useState } from 'react';
import { getSessions } from '../api/studentService';
import type { Session } from '../types';

interface UseSessionPollingOptions {
  enabled: boolean;
  intervalMs?: number;
  onData?: (sessions: Session[]) => void;
}

/**
 * Polls session status at a given interval. Placeholder for real-time session status.
 * Backend can expose GET /api/student/sessions; this hook refetches on interval.
 */
export function useSessionPolling({
  enabled,
  intervalMs = 10000,
  onData,
}: UseSessionPollingOptions): { sessions: Session[]; isLoading: boolean; error: string | null } {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onDataRef = useRef(onData);
  onDataRef.current = onData;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const fetchSessions = async () => {
      setIsLoading(true);
      setError(null);
      const result = await getSessions();
      if (cancelled) return;
      setIsLoading(false);
      if (result.success && result.data) {
        setSessions(result.data);
        onDataRef.current?.(result.data);
      } else {
        setError(result.error || 'Failed to load sessions');
      }
    };

    fetchSessions();
    const id = setInterval(fetchSessions, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled, intervalMs]);

  return { sessions, isLoading, error };
}
