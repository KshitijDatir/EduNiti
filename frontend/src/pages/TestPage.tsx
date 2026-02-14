import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTestDetails, submitTest } from '../api/testService';
import { PageLoader } from '../components/Loader';
import type { TestDetails as TestDetailsType, TestSubmitAnswer } from '../types';

// ========== MOCK TEST (remove or comment out for production) ==========
const MOCK_TEST_ID = 'mock';
const MOCK_TEST: TestDetailsType = {
  id: MOCK_TEST_ID,
  title: 'Sample Quiz (Demo)',
  questions: [
    {
      id: 'q1',
      questionText: 'What is 2 + 2?',
      options: [
        { id: 'opt1', text: '3' },
        { id: 'opt2', text: '4' },
        { id: 'opt3', text: '5' },
      ],
    },
    {
      id: 'q2',
      questionText: 'Which is a primary color?',
      options: [
        { id: 'opt4', text: 'Green' },
        { id: 'opt5', text: 'Red' },
        { id: 'opt6', text: 'Orange' },
      ],
    },
  ],
};
// ========================================================================

export function TestPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [test, setTest] = useState<TestDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!testId) {
      setLoading(false);
      setError('Invalid test.');
      return;
    }
    // ========== MOCK TEST (remove or comment out for production) ==========
    if (testId === MOCK_TEST_ID) {
      setTest(MOCK_TEST);
      setLoading(false);
      return;
    }
    // ========================================================================
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const result = await getTestDetails(testId);
      if (cancelled) return;
      if (result.success && result.data) setTest(result.data);
      else setError(result.error ?? 'Failed to load test.');
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [testId]);

  const handleSelect = (questionId: string, optionId: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testId || !test || submitted || submitting) return;

    const payload: TestSubmitAnswer[] = test.questions.map((q) => ({
      questionId: q.id,
      selectedOption: answers[q.id] ?? '',
    }));

    setSubmitting(true);
    setSubmitError(null);

    // ========== MOCK TEST (remove or comment out for production) ==========
    if (testId === MOCK_TEST_ID) {
      await new Promise((r) => setTimeout(r, 600));
      setSubmitting(false);
      setSubmitted(true);
      setSubmitSuccess(true);
      return;
    }
    // ========================================================================

    const result = await submitTest({ testId, answers: payload });
    setSubmitting(false);
    if (result.success) {
      setSubmitted(true);
      setSubmitSuccess(true);
    } else {
      setSubmitError(result.error ?? 'Submission failed.');
    }
  };

  if (loading || !testId) {
    return (
      <div className="min-h-screen bg-surface-50">
        <PageLoader />
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4">
        <div className="rounded-xl border border-surface-200 bg-white p-8 text-center shadow-sm">
          <p className="text-surface-700">{error ?? 'Test not found.'}</p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4">
        <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-green-800">Test submitted successfully</h2>
          <p className="mt-2 text-green-700">Your answers have been recorded.</p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mt-6 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-2xl font-bold text-surface-900">{test.title}</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {submitError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {submitError}
            </div>
          )}

          {test.questions.map((q, index) => (
            <fieldset
              key={q.id}
              className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm"
            >
              <legend className="text-base font-medium text-surface-900">
                Question {index + 1}: {q.questionText}
              </legend>
              <div className="mt-4 space-y-2">
                {q.options.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex cursor-pointer items-center rounded-lg border px-4 py-3 transition ${
                      answers[q.id] === opt.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-surface-200 hover:border-surface-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={opt.id}
                      checked={answers[q.id] === opt.id}
                      onChange={() => handleSelect(q.id, opt.id)}
                      disabled={submitted}
                      className="h-4 w-4 border-surface-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-3 text-surface-900">{opt.text}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-lg border border-surface-300 px-4 py-2 text-surface-700 hover:bg-surface-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || submitted}
              className="rounded-lg bg-primary-600 px-6 py-2 font-medium text-white hover:bg-primary-700 disabled:opacity-70"
            >
              {submitting ? 'Submitting...' : submitted ? 'Submitted' : 'Submit Test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
