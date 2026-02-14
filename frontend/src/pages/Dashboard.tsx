import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProfile, getResults, getUpcomingTests } from '../api/studentService';
import { useSessionPolling } from '../hooks/useSessionPolling';
import { useAuth } from '../context/AuthContext';
import type { StudentProfile, ExamResult, UpcomingTest } from '../types';

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-surface-200 ${className}`} />
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { sessions, isLoading: sessionsLoading } = useSessionPolling({
    enabled: true,
    intervalMs: 10000,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const [profileRes, resultsRes, upcomingRes] = await Promise.all([
        getProfile(),
        getResults(),
        getUpcomingTests(),
      ]);
      if (cancelled) return;
      if (profileRes.success && profileRes.data) setProfile(profileRes.data);
      if (resultsRes.success && resultsRes.data) setResults(resultsRes.data);
      if (upcomingRes.success && upcomingRes.data) setUpcoming(upcomingRes.data);
      if (!profileRes.success && profileRes.error) setError(profileRes.error);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const displayName = profile?.name ?? user?.name ?? 'Student';
  const displayEmail = profile?.email ?? user?.email ?? '';

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-surface-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Skeleton className="mb-8 h-8 w-48" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="mt-6 h-6 w-32" />
          <div className="mt-2 space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-2xl font-bold text-surface-900">Dashboard</h1>

        {error && (
          <div className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-surface-900">Profile</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-surface-500">Name</dt>
                <dd className="font-medium text-surface-900">{displayName}</dd>
              </div>
              <div>
                <dt className="text-sm text-surface-500">Email</dt>
                <dd className="font-medium text-surface-900">{displayEmail}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-surface-900">Active Sessions</h2>
            {sessionsLoading && sessions.length === 0 ? (
              <div className="space-y-2">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-surface-500">No active sessions.</p>
            ) : (
              <ul className="space-y-2">
                {sessions.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-surface-200 px-3 py-2"
                  >
                    <span className="text-sm text-surface-800">{s.testTitle ?? `Session ${s.id}`}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-surface-200 text-surface-700'
                      }`}
                    >
                      {s.status === 'active' ? 'Active' : s.status === 'completed' ? 'Completed' : 'Inactive'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="mt-8 rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-surface-900">Exam Results</h2>
          {results.length === 0 ? (
            <p className="text-sm text-surface-500">No results yet.</p>
          ) : (
            <ul className="divide-y divide-surface-200">
              {results.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3 first:pt-0">
                  <span className="font-medium text-surface-900">{r.testTitle}</span>
                  <span className="text-sm text-surface-600">
                    {r.score} / {r.totalQuestions}
                  </span>
                  <span className="text-xs text-surface-500">
                    {new Date(r.completedAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8 rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-surface-900">Upcoming Tests</h2>
          {upcoming.length === 0 ? (
            <>
              <p className="text-sm text-surface-500">No upcoming tests.</p>
              {/* ========== MOCK TEST (remove or comment out for production) ========== */}
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-800">Try the demo test:</p>
                <Link
                  to="/test/mock"
                  className="mt-2 inline-block rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
                >
                  Start sample quiz
                </Link>
              </div>
              {/* ======================================================================== */}
            </>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-lg border border-surface-200 px-4 py-3">
                  <span className="font-medium text-surface-900">{t.title}</span>
                  <span className="text-sm text-surface-500">
                    {new Date(t.scheduledAt).toLocaleString()}
                  </span>
                  <Link
                    to={`/test/${t.id}`}
                    className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
                  >
                    Start
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
