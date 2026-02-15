/* ═══════════════════════════════════════════════════════════════
   API Client — Fetch wrapper with JWT auth
   ═══════════════════════════════════════════════════════════════ */

const API_BASE = '/api';

let tokenGetter = () => null;

/** Register the function that retrieves the current JWT */
export function setTokenGetter(fn) {
    tokenGetter = fn;
}

/** Generic request function */
async function request(endpoint, options = {}) {
    const token = tokenGetter();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const json = await res.json().catch(() => null);

    if (!res.ok) {
        const msg = json?.message || `Request failed (${res.status})`;
        throw new Error(msg);
    }

    return json;
}

/* ── Auth ─────────────────────────────────────────────────────── */
export const auth = {
    login: (email, password) =>
        request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (email, name, password) =>
        request('/auth/register', { method: 'POST', body: JSON.stringify({ email, name, password }) }),
    me: () => request('/auth/me'),
};

/* ── Dashboard ────────────────────────────────────────────────── */
export const dashboard = {
    profile: () => request('/student/profile'),
    results: () => request('/student/results'),
    sessions: () => request('/student/sessions'),
    upcomingTests: () => request('/student/upcoming-tests'),
};

/* ── Tests ─────────────────────────────────────────────────────── */
export const tests = {
    live: () => request('/test/live'),
    getById: (testId) => request(`/test/${testId}`),
    submit: (testId, answers) =>
        request(`/test/${testId}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
};
