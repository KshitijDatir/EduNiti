# NeuraMach.AI — Backend Integration Guide

---

## 1. Overview

- **Frontend base URL:** Configured via `VITE_API_BASE_URL` (e.g. `http://localhost:3000`). All API requests go to this origin.
- **Auth:** JWT in memory only. Frontend sends `Authorization: Bearer <token>` on every authenticated request.
- **On 401:** Frontend treats the user as logged out and redirects to login. Return 401 for expired/invalid tokens.

---

## 2. Response format

The frontend accepts **either** of these response shapes:

**Option A — Wrapped (recommended):**
```json
{
  "data": { ... actual payload ... },
  "message": "Optional success message"
}
```

**Option B — Raw:**  
Return the payload directly (e.g. `{ "token": "...", "user": { ... } }`).

**Errors:** On 4xx/5xx, optional body:
```json
{
  "message": "Human-readable error message"
}
```
The frontend displays `response.data.message` to the user when present.

---

## 3. Authentication

### 3.1 Email/password login

| Item | Value |
|------|--------|
| **Method** | `POST` |
| **URL** | `/api/auth/login` |
| **Headers** | `Content-Type: application/json` |
| **Body** | See below |
| **Response** | See below |

**Request body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Success response (200):**  
Either wrapped `{ "data": { "token": "...", "user": { ... } } }` or raw:
```json
{
  "token": "YOUR_JWT_STRING",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string"
  }
}
```

**Error (4xx/5xx):**  
Optional body: `{ "message": "Invalid credentials" }`. Frontend shows this message.

---

### 3.2 Google OAuth flow

The frontend does **not** call Google directly. It only redirects the user to your backend; you handle Google and then redirect back to the frontend with a JWT.

**Step 1 — Entry (frontend → backend)**  
When the user clicks “Login with Google”, the frontend redirects the browser to:

```
GET ${VITE_API_BASE_URL}/api/auth/oauth/google
```

**What you must do:**

1. **Implement** `GET /api/auth/oauth/google`  
   - Redirect the user to Google’s OAuth consent screen (use your Google OAuth client ID, scopes, etc.).

2. **Implement** your own backend callback (e.g. `GET /api/auth/oauth/google/callback`)  
   - Google will redirect the user here with a code (or token).  
   - Exchange code for Google user info, verify the token.  
   - Find or create the user in your DB.  
   - Issue **your own JWT** (same format as email/password login).

3. **Redirect the browser to the frontend** with that JWT in the query string:

```
<FRONTEND_ORIGIN>/oauth/callback?token=<YOUR_JWT>
```

**Example:**  
If the frontend is at `https://app.neuramach.ai`, redirect to:

```
https://app.neuramach.ai/oauth/callback?token=eyJhbGciOiJIUzI1NiIs...
```

- **Query parameter name must be:** `token`  
- **Value:** Your JWT string (no extra encoding).  
- The frontend will read `token`, store it in memory, and redirect the user to the dashboard.  
- **Do not** redirect to the frontend with missing or empty `token`; the frontend will show an error.

**Summary of auth endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/auth/login` | Email/password login. Returns `{ token, user }`. |
| `GET`  | `/api/auth/oauth/google` | Entry for Google OAuth. Backend redirects to Google. |
| `GET`  | `/api/auth/oauth/google/callback` | Your callback from Google; issue JWT and redirect to frontend `/oauth/callback?token=JWT`. |

---

## 4. Authenticated requests

After login (email/password or Google), the frontend sends:

```
Authorization: Bearer <JWT>
Content-Type: application/json
```

on every request to the endpoints below.  
Use the same JWT validation for all of them. Return **401** if the token is missing, invalid, or expired.

---

## 5. Student endpoints

Base path: same as `VITE_API_BASE_URL`. All require `Authorization: Bearer <token>`.

### 5.1 Get student profile

| Item | Value |
|------|--------|
| **Method** | `GET` |
| **URL** | `/api/student/profile` |
| **Response** | Object with `id`, `name`, `email` |

**Success (200):**  
Wrapped `{ "data": { ... } }` or raw:
```json
{
  "id": "string",
  "name": "string",
  "email": "string"
}
```

---

### 5.2 Get exam results

| Item | Value |
|------|--------|
| **Method** | `GET` |
| **URL** | `/api/student/results` |
| **Response** | Array of exam result objects |

**Success (200):**  
Wrapped `{ "data": [ ... ] }` or raw array:
```json
[
  {
    "id": "string",
    "testTitle": "string",
    "score": 8,
    "totalQuestions": 10,
    "completedAt": "2025-02-14T12:00:00.000Z"
  }
]
```

- `completedAt`: ISO 8601 date-time string.

---

### 5.3 Get sessions

| Item | Value |
|------|--------|
| **Method** | `GET` |
| **URL** | `/api/student/sessions` |
| **Response** | Array of session objects |

**Success (200):**  
Wrapped `{ "data": [ ... ] }` or raw array:
```json
[
  {
    "id": "string",
    "testTitle": "string",
    "startedAt": "2025-02-14T10:00:00.000Z",
    "status": "active"
  }
]
```

- `status`: one of `"active"` | `"inactive"` | `"completed"`.  
- `testTitle` is optional.  
- `startedAt`: ISO 8601 date-time string.

The frontend polls this every 10 seconds for the dashboard “Active Sessions” block.

---

### 5.4 Get upcoming tests

| Item | Value |
|------|--------|
| **Method** | `GET` |
| **URL** | `/api/student/upcoming-tests` |
| **Response** | Array of upcoming test objects |

**Success (200):**  
Wrapped `{ "data": [ ... ] }` or raw array:
```json
[
  {
    "id": "string",
    "title": "string",
    "scheduledAt": "2025-02-15T14:00:00.000Z"
  }
]
```

- `scheduledAt`: ISO 8601 date-time string.  
- Frontend uses `id` to link to the test page: `/test/:id`.

---

## 6. Test endpoints

### 6.1 Get test details

| Item | Value |
|------|--------|
| **Method** | `GET` |
| **URL** | `/api/test/:testId` |
| **Response** | Test with title and questions (with options) |

**Success (200):**  
Wrapped `{ "data": { ... } }` or raw:
```json
{
  "id": "string",
  "title": "string",
  "questions": [
    {
      "id": "string",
      "questionText": "string",
      "options": [
        { "id": "string", "text": "string" },
        { "id": "string", "text": "string" }
      ]
    }
  ]
}
```

- Each question has a unique `id` and at least one option.  
- Each option has `id` and `text`.  
- Frontend uses `questionId` and `selectedOption` (option `id`) when submitting.

**Error (404):**  
Optional `{ "message": "Test not found" }`. Frontend shows error and “Back to Dashboard”.

---

### 6.2 Submit test

| Item | Value |
|------|--------|
| **Method** | `POST` |
| **URL** | `/api/test/submit` |
| **Headers** | `Authorization: Bearer <token>`, `Content-Type: application/json` |
| **Body** | See below |
| **Response** | See below |

**Request body:**
```json
{
  "testId": "string",
  "answers": [
    { "questionId": "string", "selectedOption": "string" },
    { "questionId": "string", "selectedOption": "string" }
  ]
}
```

- `questionId`: from `GET /api/test/:testId` question `id`.  
- `selectedOption`: from the chosen option’s `id` for that question.

**Success (200):**  
Any JSON is acceptable. Frontend only checks for success (2xx). Optional:
```json
{
  "score": 8,
  "message": "Test submitted successfully"
}
```

**Error (4xx/5xx):**  
Optional body: `{ "message": "Submission failed" }`. Frontend shows this message.

---

## 7. Quick reference — all endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `POST` | `/api/auth/login` | No | Email/password login. Body: `{ email, password }`. Response: `{ token, user }`. |
| `GET`  | `/api/auth/oauth/google` | No | Redirect user to Google OAuth. |
| `GET`  | `/api/auth/oauth/google/callback` | No | Your callback from Google; then redirect to frontend `/oauth/callback?token=JWT`. |
| `GET`  | `/api/student/profile` | Bearer | Student profile: `{ id, name, email }`. |
| `GET`  | `/api/student/results` | Bearer | List of exam results (see shape above). |
| `GET`  | `/api/student/sessions` | Bearer | List of sessions (see shape above). Polled every 10s. |
| `GET`  | `/api/student/upcoming-tests` | Bearer | List of upcoming tests (see shape above). |
| `GET`  | `/api/test/:testId` | Bearer | Test details (title, questions, options). |
| `POST` | `/api/test/submit` | Bearer | Submit answers. Body: `{ testId, answers: [{ questionId, selectedOption }] }`. |

---

## 8. Checklist for backend team

- [ ] Implement `POST /api/auth/login` with request `{ email, password }` and response `{ token, user }` (user: `id`, `email`, `name`).
- [ ] Implement `GET /api/auth/oauth/google` → redirect to Google OAuth.
- [ ] Implement backend callback from Google → create/find user → issue JWT → redirect browser to `<FRONTEND_ORIGIN>/oauth/callback?token=<JWT>`.
- [ ] Validate JWT on all authenticated routes; return 401 when invalid/expired.
- [ ] Implement `GET /api/student/profile` returning `{ id, name, email }`.
- [ ] Implement `GET /api/student/results` returning array of `{ id, testTitle, score, totalQuestions, completedAt }`.
- [ ] Implement `GET /api/student/sessions` returning array of `{ id, testTitle?, startedAt, status }` (`status`: `active` | `inactive` | `completed`).
- [ ] Implement `GET /api/student/upcoming-tests` returning array of `{ id, title, scheduledAt }`.
- [ ] Implement `GET /api/test/:testId` returning `{ id, title, questions: [{ id, questionText, options: [{ id, text }] }] }`.
- [ ] Implement `POST /api/test/submit` with body `{ testId, answers: [{ questionId, selectedOption }] }`; return 200 with optional `{ score, message }`.
- [ ] Use CORS to allow the frontend origin (from `VITE_API_BASE_URL` or your frontend domain).
- [ ] On errors, optionally return `{ "message": "..." }` so the frontend can show it to the user.

---

## 9. Contact

For questions about the frontend behavior or these contracts, contact the frontend team. This document is the single source of truth for what the NeuraMach.AI frontend expects from the backend.
