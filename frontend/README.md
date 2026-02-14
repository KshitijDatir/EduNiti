# NeuraMach.AI – Frontend

Scalable React + TypeScript frontend for the NeuraMach.AI learning platform. Built with Vite, Tailwind CSS, React Router, and a dedicated API layer for backend integration.

## Quick start

```bash
npm install
cp .env.example .env
# Edit .env and set VITE_API_BASE_URL to your backend URL
npm run dev
```

## Changing the API base URL

1. Copy `.env.example` to `.env`.
2. Set `VITE_API_BASE_URL` to your backend base URL (no trailing slash), e.g.:
   - `VITE_API_BASE_URL=https://api.neuramach.ai`
   - `VITE_API_BASE_URL=http://localhost:3000`
3. Restart the dev server after changing `.env`.

All API calls use this base URL via the shared axios instance in `src/api/axiosConfig.ts`.

## Backend integration guide

### API layer

- **Location:** `src/api/`
- **Files:** `axiosConfig.ts`, `authService.ts`, `studentService.ts`, `testService.ts`
- **Rule:** UI components never call `axios` or `fetch` directly. All requests go through these services.

### Endpoints used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/login` | Email/password login; returns JWT and user |
| GET | `/api/auth/oauth/google` | Redirect entry for Google OAuth (backend redirects to Google) |
| GET | `/api/student/profile` | Student profile (name, email) |
| GET | `/api/student/results` | Exam results list |
| GET | `/api/student/sessions` | Active/inactive sessions (polled every 10s) |
| GET | `/api/student/upcoming-tests` | Upcoming tests |
| GET | `/api/test/:testId` | Test details (title, questions, options) |
| POST | `/api/test/submit` | Submit test answers |

### Expected response formats

The frontend accepts either **wrapped** or **raw** JSON.

**Wrapped (recommended):**

```json
{
  "data": { ... },
  "message": "Optional message"
}
```

**Raw:** the payload itself (e.g. `{ "token": "...", "user": { ... } }`).

**Auth – POST `/api/auth/login`**

- **Body:** `{ "email": "string", "password": "string" }`
- **Success:** `{ "token": "JWT", "user": { "id": "string", "email": "string", "name": "string" } }`
- **Error:** HTTP 4xx/5xx; optional body `{ "message": "string" }` shown to user.

**Student profile – GET `/api/student/profile`**

- **Headers:** `Authorization: Bearer <token>`
- **Success:** `{ "id": "string", "name": "string", "email": "string" }`

**Student results – GET `/api/student/results`**

- **Success:** array of `{ "id", "testTitle", "score", "totalQuestions", "completedAt" }`

**Student sessions – GET `/api/student/sessions`**

- **Success:** array of `{ "id", "testTitle?", "startedAt", "status": "active" | "inactive" | "completed" }`

**Upcoming tests – GET `/api/student/upcoming-tests`**

- **Success:** array of `{ "id", "title", "scheduledAt" }`

**Test details – GET `/api/test/:testId`**

- **Success:** `{ "id", "title", "questions": [ { "id", "questionText", "options": [ { "id", "text" } ] } ] }`

**Submit test – POST `/api/test/submit`**

- **Body:** `{ "testId": "string", "answers": [ { "questionId": "string", "selectedOption": "string" } ] }`
- **Success:** any JSON (e.g. `{ "score": number, "message": "string" }`); frontend shows a success message and redirects to dashboard.

### Auth

- JWT is kept in memory (React Context). No localStorage.
- `axiosConfig` attaches `Authorization: Bearer <token>` to every request.
- On 401, the app emits `auth:unauthorized` and the context clears the token and redirects to login.

---

## Hybrid Authentication Flow

The app supports two sign-in methods with the same JWT session handling.

### Local (email/password) flow

1. User enters email and password on `/login`.
2. Frontend calls `POST /api/auth/login` via `authService.loginWithEmail()`.
3. Backend returns `{ token, user }`.
4. Frontend stores token in memory (AuthContext) and redirects to dashboard.

### Google OAuth flow

1. User clicks “Login with Google” on `/login`.
2. Frontend redirects the browser to **`${VITE_API_BASE_URL}/api/auth/oauth/google`** (via `authService.initiateGoogleLogin()`). No API call from frontend; full redirect.
3. Backend redirects to Google consent screen, then handles Google callback.
4. Backend verifies the Google token, creates or finds the user, issues its own JWT, then redirects the user to the **frontend** with the JWT in the query string:
   - **Expected redirect URL:** `https://your-frontend-domain.com/oauth/callback?token=JWT_TOKEN`
   - Configure this exact path (and origin) in your backend as the OAuth “frontend callback” or “redirect_uri” for the OAuth flow.
5. Frontend route `/oauth/callback` runs: it reads `token` from the URL, validates presence, stores it in AuthContext (`loginWithOAuthToken`), then redirects to `/dashboard`. No token in `localStorage`; same in-memory session as email/password.
6. Protected routes and logout behave the same for both flows.

### Expected backend endpoints (auth)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/login` | Email/password login; returns `{ token, user }`. |
| GET  | `/api/auth/oauth/google` | Entry for Google OAuth. Backend redirects to Google consent. |
| GET  | `/api/auth/oauth/google/callback` | Backend’s callback from Google; backend verifies Google token, issues internal JWT, then redirects browser to frontend `/oauth/callback?token=JWT`. |

### Backend redirect format (OAuth)

After the backend has validated the user with Google and created an internal JWT, it must redirect the **browser** to:

```
<frontend-origin>/oauth/callback?token=<JWT>
```

Example (production): `https://app.neuramach.ai/oauth/callback?token=eyJhbG...`

- **Query parameter:** `token` (required). Any other query params are ignored by the frontend.
- If `token` is missing or empty, the frontend shows an error and a “Back to Login” button.
- Token is never stored in `localStorage`; it is kept only in memory (React Context). Logout clears it; 401 from API triggers logout as before.

### Adding or changing endpoints

1. Add or edit the URL constant and function in the right file under `src/api/`.
2. Keep using the same axios instance (`apiClient`) so the token is always sent.
3. Use the same try/catch and return shape: `{ success: boolean, data?: T, error?: string }`.

## Project structure

```
src/
  api/           # All backend calls (auth, student, test)
  context/       # Auth state (AuthContext)
  pages/         # Login, Dashboard, TestPage
  components/    # ProtectedRoute, Loader, Navbar
  hooks/         # e.g. useSessionPolling
  types/         # Shared TypeScript types
  App.tsx
  main.tsx
```

## Scripts

- `npm run dev` – development server
- `npm run build` – production build
- `npm run preview` – preview production build

## Tech stack

- React 18, TypeScript, Vite
- Tailwind CSS
- React Router 6
- Axios
- Context API for auth (no Redux)

This frontend is designed to be API-connectable: no hardcoded business logic, configurable base URL, and a single service layer for the backend team to plug in.
