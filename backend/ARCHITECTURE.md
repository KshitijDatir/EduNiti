# EduNiti — Complete System Architecture

> Comprehensive guide covering every component, service, design decision, and implementation detail.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Technology Stack](#3-technology-stack)
4. [Backend — Microservices](#4-backend--microservices)
5. [NGINX API Gateway](#5-nginx-api-gateway)
6. [Redis Caching Layer](#6-redis-caching-layer)
7. [CDN — CloudFront Video Delivery](#7-cdn--cloudfront-video-delivery)
8. [Database Layer](#8-database-layer)
9. [Authentication System](#9-authentication-system)
10. [Frontend — React SPA](#10-frontend--react-spa)
11. [Load Testing](#11-load-testing)
12. [Redis Analytics Dashboard](#12-redis-analytics-dashboard)
13. [Docker & Containerization](#13-docker--containerization)
14. [Project Structure](#14-project-structure)
15. [API Reference](#15-api-reference)
16. [Environment Variables](#16-environment-variables)
17. [Setup & Deployment](#17-setup--deployment)
18. [Troubleshooting](#18-troubleshooting)
19. [Design Decisions & Tradeoffs](#19-design-decisions--tradeoffs)
20. [Future Roadmap](#20-future-roadmap)

---

## 1. System Overview

**EduNiti** is a scalable learning platform where students can:

- Register and log in with email/password
- Take timed MCQ tests with multiple-choice questions
- Watch video lectures served from a CloudFront CDN
- View their test results and performance history
- See upcoming and live tests in real time

The system is built as a **microservices architecture** with:

- **3 independent backend services** (auth, dashboard, test)
- **NGINX reverse proxy** as the single API gateway
- **Redis** for sub-millisecond caching of test data
- **PostgreSQL** as the persistent data store (3 separate databases)
- **CloudFront CDN** for video content delivery
- **React SPA** frontend with Vite dev server
- **Docker Compose** for local orchestration of all 6 containers

---

## 2. Architecture Diagram

### Full System Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        STUDENT'S BROWSER                            │
│                     http://localhost:5173                            │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │Dashboard │ │Live Test │ │ Videos   │ │Load Test │ │  Redis   │ │
│  │  Page    │ │  Page    │ │  Page    │ │  Page    │ │Analytics │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │
│       │             │            │             │            │       │
└───────┼─────────────┼────────────┼─────────────┼────────────┼───────┘
        │             │            │             │            │
        ▼             ▼            │             ▼            ▼
 ┌──────────────────────────┐      │    ┌────────────────────────────┐
 │    Vite Dev Proxy         │      │    │    External Submit API     │
 │    /api/* → port 80       │      │    │  http://192.168.49.2/submit│
 └────────────┬──────────────┘      │    └────────────────────────────┘
              │                     │
              ▼                     │
 ┌────────────────────────────┐     │
 │     NGINX (port 80)        │     │
 │     Reverse Proxy + CORS   │     │
 │     Rate Limit: 10r/s      │     │
 └──┬────────┬────────┬───────┘     │
    │        │        │             │
    ▼        ▼        ▼             ▼
 ┌──────┐ ┌──────┐ ┌──────┐  ┌──────────────┐
 │ AUTH │ │DASHB.│ │ TEST │  │  CloudFront  │
 │:3001 │ │:3002 │ │:3003 │  │  CDN (AWS)   │
 └──┬───┘ └──┬───┘ └──┬───┘  └──────────────┘
    │        │        │
    ▼        ▼        ├──────────┐
 ┌──────┐ ┌──────┐    ▼          ▼
 │xenia │ │xenia │ ┌──────┐  ┌──────┐
 │_auth │ │_dash │ │Redis │  │xenia │
 │(PG)  │ │(PG)  │ │Cache │  │_tests│
 └──────┘ └──────┘ └──────┘  │(PG)  │
                              └──────┘
```

### Request Flow (Cache-First Pattern)

```
GET /api/test/:testId
        │
        ▼
 NGINX → test-service:3003
        │
        ▼
 JWT Middleware (verify token)
        │
        ▼
 Zod Validation (check UUID format)
        │
        ▼
 Redis Cache Lookup ─── HIT? ──── YES → Return cached data (~0.5ms)
        │
        NO (MISS)
        │
        ▼
 PostgreSQL Query (join Test + Questions + Options)
        │
        ▼
 Strip isCorrect field (students can't see answers)
        │
        ▼
 Store in Redis (TTL: 600s / 10 minutes)
        │
        ▼
 Return response to student (~5-50ms)
```

---

## 3. Technology Stack

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 20 | Runtime for all services |
| Express | 4.x | HTTP framework |
| TypeScript | 5.x | Type-safe development |
| Prisma | 5.x | ORM, schema management, migrations |
| PostgreSQL | 16 | Persistent storage (3 databases) |
| Redis | 7 | In-memory cache |
| ioredis | 5.x | Redis client (supports standalone + cluster) |
| bcryptjs | 2.x | Password hashing (pure JS, no native deps) |
| jsonwebtoken | 9.x | JWT creation and verification |
| Zod | 3.x | Runtime schema validation |
| NGINX | 1.27 | Reverse proxy, rate limiting, CORS |
| Docker | Latest | Containerization |
| Docker Compose | v2 | Multi-container orchestration |

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18 | UI framework |
| Vite | 5.x | Dev server with HMR |
| React Router | v6 | Client-side routing |
| Vanilla CSS | — | Custom design system (no Tailwind) |
| Fetch API | — | HTTP client for API calls |

### Infrastructure

| Technology | Purpose |
|-----------|---------|
| AWS CloudFront | CDN for video content delivery |
| AWS S3 | Origin storage for video files |

---

## 4. Backend — Microservices

Each service is an independent Node.js application with its own database, Dockerfile, and health check.

### 4.1 Auth Service (port 3001)

**Purpose:** User registration, login, JWT issuance, and token verification.

**Database:** `xenia_auth` (PostgreSQL)

**Schema:**
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  password  String   // bcryptjs hashed
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Endpoints:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Create new account |
| POST | `/api/auth/login` | No | Verify credentials, issue JWT |
| GET | `/api/auth/me` | Yes | Verify token, return user |
| GET | `/api/auth/health` | No | Health check |

**Security Details:**
- Passwords are hashed with `bcryptjs` (10 rounds, pure JS — no native C++ compilation needed)
- JWTs expire after 24 hours (configurable via `JWT_EXPIRES_IN`)
- Shared JWT secret (`dev-secret-change-in-production`) is used across all services for token verification
- Health check uses `curl` (installed in Dockerfile alongside `openssl`)

**Key Fix:** The original Dockerfile used `wget` for health checks, but `node:20-slim` doesn't include `wget`. Switched to `curl` (explicitly installed via `apt-get install -y openssl curl`).

### 4.2 Dashboard Service (port 3002)

**Purpose:** Student profile, test results, sessions, and upcoming tests.

**Database:** `xenia_dashboard` (PostgreSQL)

**Endpoints:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/student/profile` | Yes | Student details + stats |
| GET | `/api/student/results` | Yes | Exam history |
| GET | `/api/student/sessions` | Yes | Active test sessions |
| GET | `/api/student/upcoming-tests` | Yes | Scheduled exams |
| GET | `/api/student/health` | No | Health check |

### 4.3 Test Service (port 3003)

**Purpose:** Core service. Fetches test questions with Redis caching, CDN video references, and cache analytics.

**Database:** `xenia_tests` (PostgreSQL)

**Schema:**
```prisma
model Test {
  id          String     @id @default(uuid())
  title       String
  scheduledAt DateTime?
  isActive    Boolean    @default(true)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  questions   Question[]
}

model Question {
  id           String   @id @default(uuid())
  questionText String
  mediaUrl     String?  // CloudFront CDN URL for video questions
  mediaType    String?  // "video" | "image" | null
  sortOrder    Int
  testId       String
  test         Test     @relation(fields: [testId], references: [id])
  options      Option[]
}

model Option {
  id         String   @id @default(uuid())
  text       String
  isCorrect  Boolean  @default(false)
  sortOrder  Int
  questionId String
  question   Question @relation(fields: [questionId], references: [id])
}
```

**Endpoints:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/test/health` | No | Health check |
| GET | `/api/test/cache/stats` | Yes | Real-time Redis analytics |
| POST | `/api/test/cache/reset` | Yes | Reset cache counters |
| GET | `/api/test/live` | Yes | Get current live test |
| GET | `/api/test/:testId` | Yes | Get test with questions (cache-first) |
| POST | `/api/test/:testId/submit` | Yes | Submit answers (stub — 501) |

**Route ordering matters:** `/cache/stats` and `/live` are defined **before** `/:testId` to prevent route collision (otherwise `cache` and `live` would be treated as a `testId`).

**Key Implementation Details:**

1. **Cache-first fetch:** `getTestById()` checks Redis → falls back to PostgreSQL → caches result
2. **Security:** `isCorrect` field is **excluded** from API responses (students cannot see correct answers)
3. **Media support:** Questions can include `mediaUrl` (CloudFront) and `mediaType` (video/image)
4. **TTL:** Cached tests expire after 600 seconds (10 minutes), configurable via `CACHE_TEST_TTL`
5. **Fail-open:** If Redis errors, the service falls back to direct DB queries without crashing

**Seed Data (4 tests):**

| Test | Questions | Videos |
|------|-----------|--------|
| JavaScript Fundamentals | 5 MCQs | 0 |
| Data Structures & Algorithms | 3 MCQs | 0 |
| React Basics | 4 MCQs | 0 |
| Video Learning Module | 3 MCQs | 2 CloudFront videos |

---

## 5. NGINX API Gateway

**File:** `backend/nginx/nginx.conf`

NGINX sits in front of all services as the single entry point on port 80.

### Routing Rules

| URL Pattern | Upstream | Service |
|-------------|----------|---------|
| `/api/auth/*` | `auth-service:3001` | Authentication |
| `/api/student/*` | `dashboard-service:3002` | Dashboard |
| `/api/test/*` | `test-service:3003` | Test fetching + cache |
| `/health` | — | NGINX self-check |

### Features Configured

| Feature | Details |
|---------|---------|
| **Rate Limiting** | 10 requests/second per IP, burst of 20 |
| **CORS** | Origins: `http://localhost:5173`, `http://localhost` |
| **Security Headers** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection` |
| **Preflight (OPTIONS)** | Returns `204 No Content` immediately |
| **Proxy Timeouts** | Connect: 5s, Send: 10s, Read: 10-30s |
| **Keepalive** | 65 second timeout |
| **Max Body** | 5MB |
| **Logging** | Custom format with upstream address and response time |

### Startup Dependency

NGINX only starts after **all 3 services are healthy**:
```yaml
depends_on:
  auth-service:
    condition: service_healthy
  dashboard-service:
    condition: service_healthy
  test-service:
    condition: service_healthy
```

---

## 6. Redis Caching Layer

### Why Redis?

| Reason | Explanation |
|--------|-------------|
| **Speed** | In-memory store. Sub-millisecond reads vs 5-50ms PostgreSQL queries |
| **DB Load Reduction** | 100 students fetching the same test = 1 DB query + 99 cache hits |
| **TTL-Based Expiry** | Data auto-expires after 10 min, ensuring fresh content |
| **Fail-Open Design** | If Redis crashes, the app falls back to direct DB queries seamlessly |

### Configuration

```yaml
redis:
  image: redis:7-alpine
  command: redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru
```

- **Memory limit:** 128MB
- **Eviction policy:** `allkeys-lru` (Least Recently Used eviction when full)
- **Mode:** Standalone for local dev, supports cluster mode via `REDIS_MODE=cluster`

### Redis Client (ioredis)

```typescript
// Supports both standalone and Redis Cluster
if (env.REDIS_MODE === 'cluster') {
    redis = new Cluster(nodes, { ... });
} else {
    redis = new Redis(env.REDIS_URL, { ... });
}
```

- **Max retries:** 3 per request
- **Connect timeout:** 10 seconds
- **Retry strategy:** Exponential backoff, max 2000ms, stops after 5 attempts

### Cache Operations

| Function | Purpose |
|----------|---------|
| `getCachedTest(testId)` | Get from Redis, return `null` on miss |
| `setCachedTest(testId, data)` | Store in Redis with TTL |
| `invalidateCachedTest(testId)` | Delete single cached test |
| `invalidateAllTests()` | Scan-based deletion (safe, no `KEYS` command) |
| `getCacheStats()` | Real-time analytics (app counters + Redis INFO) |
| `resetCacheCounters()` | Reset app counters for demo purposes |

### Cache Key Format

```
test:{uuid}
```

Example: `test:3fa85f64-5717-4562-b3fc-2c963f66afa6`

---

## 7. CDN — CloudFront Video Delivery

### How It Works

1. Video files are stored in an **AWS S3 bucket**
2. **CloudFront** distribution sits in front of S3 as a CDN
3. Video URLs are stored in the `mediaUrl` field of each Question in PostgreSQL
4. The frontend `<video>` player loads directly from CloudFront
5. No video traffic passes through the backend — CDN handles it entirely

### Current CDN URLs

| Video | CloudFront URL |
|-------|---------------|
| Project Demo (Argo CI/CD) | `https://d1mh8twbagv3j5.cloudfront.net/argo_final.mp4` |
| Neural Networks Intro | `https://d1mh8twbagv3j5.cloudfront.net/101-intro.mp4` |

### Why CDN?

- **Latency:** CloudFront edge nodes are geographically close to users
- **Bandwidth:** Offloads heavy video traffic from the backend
- **Scalability:** CDN handles thousands of concurrent video streams
- **Cost:** Only pay for actual data transfer, no backend compute cost for serving videos

---

## 8. Database Layer

### PostgreSQL Configuration

```yaml
postgres:
  image: postgres:16-alpine
  environment:
    POSTGRES_USER: xenia
    POSTGRES_PASSWORD: xenia_secret
    POSTGRES_DB: xenia_tests
```

### Three Separate Databases

| Database | Used By | Purpose |
|----------|---------|---------|
| `xenia_auth` | auth-service | Users, passwords |
| `xenia_dashboard` | dashboard-service | Profiles, results, sessions |
| `xenia_tests` | test-service | Tests, questions, options |

Multi-database creation is handled by `postgres/init-databases.sh`, which runs on first PostgreSQL startup.

### Prisma ORM

Each service that uses a database has its own Prisma setup:

```
service/
├── prisma/
│   ├── schema.prisma    ← Table definitions
│   ├── seed.ts          ← Initial data
│   └── migrations/      ← Schema version history
```

**Key Prisma commands:**
- `prisma db push` — Sync schema to database (used in development)
- `prisma generate` — Generate TypeScript client
- `prisma db seed` — Run seed file

The test-service **auto-runs** schema push + seed on startup via `entrypoint.sh`:
```bash
npx prisma db push --skip-generate
node dist/prisma/seed.js 2>/dev/null || npx tsx prisma/seed.ts
```

---

## 9. Authentication System

### Flow

```
1. Student registers:   POST /api/auth/register { email, name, password }
                         → Password hashed with bcryptjs (10 rounds)
                         → User saved to xenia_auth database
                         → JWT issued

2. Student logs in:     POST /api/auth/login { email, password }
                         → Find user by email
                         → Compare password with bcryptjs
                         → Issue JWT { userId, email, name }

3. Authenticated request: GET /api/test/:id
                          → Header: Authorization: Bearer <JWT>
                          → authenticate.ts middleware verifies signature
                          → Extracts userId, attaches to req.user
                          → Controller processes request
```

### JWT Token Structure

```json
{
  "userId": "uuid",
  "email": "student@eduniti.com",
  "name": "Student Name",
  "iat": 1708000000,
  "exp": 1708086400
}
```

- **Signed with:** `HS256` algorithm
- **Secret:** Shared across all services (configurable via `JWT_SECRET`)
- **Expiry:** 24 hours
- **Storage:** Frontend stores JWT in `sessionStorage` (cleared on tab close)

### Why bcryptjs (not bcrypt)?

The native `bcrypt` package requires C++ compilation (`node-gyp`), which consistently fails on `node:20-slim` Docker images (missing build tools). `bcryptjs` is a pure JavaScript implementation — same API, same security, zero native dependencies. Tradeoff: ~3x slower hashing, but negligible for a learning platform with low registration volume.

---

## 10. Frontend — React SPA

### Tech Choices

| Choice | Reason |
|--------|--------|
| Vite (not CRA) | 10x faster dev server, native ESM, HMR |
| Vanilla CSS (not Tailwind) | Full control over design system, no build dependency |
| sessionStorage (not localStorage) | Tokens cleared on tab close = more secure |
| Fetch API (not axios) | Zero dependencies for HTTP, native browser API |

### Design System

Defined in `src/index.css` with CSS custom properties:

```css
:root {
    --bg-primary: #0a0a0f;
    --bg-secondary: #12121a;
    --text-primary: #e8e8ed;
    --text-secondary: #9898a8;
    --accent-blue: #4f8eff;
    --accent-green: #2dd4a8;
    --accent-red: #ff4f5e;
    --accent-orange: #ff9f43;
    --accent-cyan: #00d2ff;
    --radius-sm: 8px;
    --radius-md: 12px;
    --transition: 0.2s ease;
}
```

Dark theme, subtle gradients, smooth animations, and glassmorphism cards.

### Pages (16 files)

| Route | Page | Purpose |
|-------|------|---------|
| `/login` | LoginPage | Login + Registration (toggle) |
| `/dashboard` | DashboardPage | Profile, stats, live test banner, recent results, upcoming tests |
| `/test` | LiveTestPage | Shows the current live test |
| `/test/:testId` | TestPage | Take a test (questions, options, video content) |
| `/test/:testId/submit` | SubmitPage | Submit test (sends POST to external API) |
| `/videos` | VideosPage | Video library listing |
| `/videos/:questionId` | VideoPlayerPage | Video player (CloudFront CDN) |
| `/results` | ResultsPage | Historical results and performance stats |
| `/loadtest` | LoadTestPage | Simulate 20k concurrent requests |
| `/redis` | RedisPage | Real-time Redis cache analytics |

### Routing & Auth

- **React Router v6** handles all navigation
- **ProtectedRoute** component wraps authenticated routes
- **AuthContext** manages user state, token storage, login/logout
- **API Client** (`src/api/client.js`) adds JWT to all requests automatically

### API Client

```javascript
// Auto-attaches JWT to every request
async function request(endpoint, options = {}) {
    const token = tokenGetter();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`/api${endpoint}`, { ...options, headers });
    ...
}

// Usage
export const tests = {
    live: () => request('/test/live'),
    getById: (testId) => request(`/test/${testId}`),
    cacheStats: () => request('/test/cache/stats'),
    cacheReset: () => request('/test/cache/reset', { method: 'POST' }),
};
```

### Vite Proxy Configuration

```javascript
// vite.config.js
export default defineConfig({
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost',
                changeOrigin: true,
            }
        }
    }
});
```

Frontend `/api/*` requests are proxied to NGINX on port 80 during development.

---

## 11. Load Testing

### Browser-Based Load Test (LoadTestPage)

The `/loadtest` page simulates real-world traffic from the browser:

| Parameter | Value |
|-----------|-------|
| Total Requests | 20,000 |
| Concurrent Workers | 200 |
| Target URL | `http://192.168.49.2/submit` |
| Method | POST |
| Body | `data:test` |
| Mode | `no-cors` (opaque responses) |

**How it works:**
1. Creates a pool of 200 concurrent workers (using Promise-based concurrency control)
2. Each worker sends sequential POST requests until the total quota is met
3. Tracks completed count, errors, and requests/second in real time
4. Displays live progress bar with percentage
5. Shows final results: total time, avg requests/sec, error rate

**Why `no-cors`?** The external API at `192.168.49.2` doesn't set CORS headers. Using `no-cors` mode allows firing the request (the server still receives it) but makes the response opaque to the browser.

### CLI Alternative (hey)

The page also displays the equivalent `hey` command for more accurate benchmarking:

```bash
hey -n 20000 -c 200 -m POST -d "data:test" http://192.168.49.2/submit
```

`hey` is a Go-based HTTP load generator that provides detailed latency percentiles (p50, p95, p99) and throughput metrics.

### Submit Page

`/test/:testId/submit` sends a single POST request to `http://192.168.49.2/submit` with body `data:test`, simulating a test submission to the external API.

---

## 12. Redis Analytics Dashboard

### Purpose

The `/redis` page proves **why Redis matters** with live data. It's designed for presentations and demos.

### Backend (Cache Counter System)

In `testCache.ts`, I added application-level counters:

```typescript
const counters = {
    hits: 0,          // Redis had the data
    misses: 0,        // Redis didn't have it (queried DB)
    sets: 0,          // Data written to Redis
    errors: 0,        // Redis failures
    startedAt: Date.now(),
    latencyHistory: [] // { type: 'hit'|'miss', ms, timestamp }
};
```

Every call to `getCachedTest()`:
1. Starts a `performance.now()` timer
2. Queries Redis
3. Records the result (hit or miss) with exact millisecond latency
4. Increments the appropriate counter

`getCacheStats()` combines:
- **App counters** (hits, misses, hit rate, total requests, uptime)
- **Redis server stats** (`redis.info('stats')`, `redis.info('memory')`)
- **Key count** (scan for `test:*` keys)
- **Last 50 latency samples** (for chart data)

### Frontend (RedisPage)

The page polls `GET /api/test/cache/stats` every **2 seconds** and renders:

| Section | Description |
|---------|-------------|
| **Why Redis** | 4 cards explaining speed, DB load reduction, TTL, fail-open |
| **Stats Cards** | Live hit count, miss count, hit rate %, total requests |
| **Hit Rate Chart** | Bar chart (green >80%, orange >50%, red <50%) |
| **Latency Comparison** | Visual bars: avg HIT latency vs avg MISS latency |
| **Redis Server Info** | Memory usage, peak memory, keyspace stats, cached keys, uptime |
| **Simulate Buttons** | "Trigger Cache Hit" (fetches real test twice) and "Trigger Cache Miss" (fetches fake ID) |
| **Request Feed** | Last 15 requests with HIT/MISS badge, latency in ms, and timestamp |

### Simulation Buttons

- **Trigger Cache Hit:** Fetches the live test, then fetches it again by ID — the second call should be a cache HIT
- **Trigger Cache Miss:** Fetches a non-existent test ID — always results in a cache MISS
- **Reset Counters:** Calls `POST /api/test/cache/reset` to zero all counters for a clean demo

---

## 13. Docker & Containerization

### docker-compose.yml (6 Services)

| Service | Image | Port | Depends On |
|---------|-------|------|-----------|
| **nginx** | `nginx:1.27-alpine` | 80 | auth, dashboard, test (healthy) |
| **auth-service** | Custom (node:20-slim) | 3001 | postgres (healthy) |
| **dashboard-service** | Custom (node:20-slim) | 3002 | postgres (healthy) |
| **test-service** | Custom (node:20-slim) | 3003 | postgres + redis (healthy) |
| **postgres** | `postgres:16-alpine` | 5432 | — |
| **redis** | `redis:7-alpine` | 6379 | — |

### Health Checks

| Service | Command | Interval |
|---------|---------|----------|
| auth-service | `curl -f http://localhost:3001/api/auth/health` | 10s |
| dashboard-service | `wget -qO- http://localhost:3002/api/student/health` | 10s |
| test-service | `wget -qO- http://localhost:3003/api/test/health` | 10s |
| postgres | `pg_isready -U xenia -d xenia_tests` | 5s |
| redis | `redis-cli ping` | 5s |

### Startup Order

```
1. postgres + redis (independent, start first)
2. auth-service + dashboard-service + test-service (wait for postgres healthy)
3. test-service also waits for redis healthy
4. nginx (waits for ALL 3 services healthy)
```

### Multi-Stage Dockerfile (test-service)

```dockerfile
# Stage 1: Build
FROM node:20-slim AS builder
  → Install dependencies
  → Generate Prisma client
  → Compile TypeScript

# Stage 2: Production
FROM node:20-slim
  → Copy compiled JS from builder
  → Copy Prisma client + schema + seed
  → Install tsx for seeding
  → Run entrypoint.sh on start
```

### Volumes

| Volume | Purpose |
|--------|---------|
| `postgres_data` | PostgreSQL data persistence across restarts |
| `redis_data` | Redis RDB snapshot persistence |

---

## 14. Project Structure

```
EduNiti/
├── README.md                          ← Quick setup guide
│
├── backend/
│   ├── ARCHITECTURE.md                ← This file
│   ├── docker-compose.yml             ← 6-service orchestration
│   │
│   ├── nginx/
│   │   └── nginx.conf                 ← Routing, CORS, rate limiting
│   │
│   ├── postgres/
│   │   └── init-databases.sh          ← Creates 3 databases on first run
│   │
│   └── services/
│       ├── auth-service/
│       │   ├── Dockerfile             ← node:20-slim + curl
│       │   ├── entrypoint.sh
│       │   ├── package.json
│       │   ├── tsconfig.json
│       │   ├── prisma/
│       │   │   ├── schema.prisma      ← User model
│       │   │   └── seed.ts            ← Demo user
│       │   └── src/
│       │       ├── server.ts          ← Entry point
│       │       ├── app.ts             ← Express setup
│       │       ├── config/
│       │       │   ├── env.ts         ← Zod-validated env vars
│       │       │   └── database.ts    ← Prisma client
│       │       ├── controllers/
│       │       │   └── auth.controller.ts  ← register, login, me
│       │       ├── middleware/
│       │       │   └── errorHandler.ts
│       │       └── routes/
│       │           └── auth.routes.ts
│       │
│       ├── dashboard-service/
│       │   ├── Dockerfile
│       │   ├── package.json
│       │   └── src/
│       │       ├── server.ts          ← Entry point
│       │       ├── app.ts             ← Express + all endpoints
│       │       └── ...
│       │
│       └── test-service/
│           ├── Dockerfile             ← Multi-stage build
│           ├── entrypoint.sh          ← Auto: schema push + seed
│           ├── package.json
│           ├── tsconfig.json
│           ├── prisma/
│           │   ├── schema.prisma      ← Test, Question, Option
│           │   ├── seed.ts            ← 4 tests (13 questions, 2 videos)
│           │   └── test_seed.ts       ← Alternate seed (multimedia only)
│           └── src/
│               ├── server.ts          ← Connects DB + Redis, starts app
│               ├── app.ts             ← Express middleware pipeline
│               ├── config/
│               │   ├── env.ts         ← Zod-validated env vars
│               │   ├── database.ts    ← Prisma client singleton
│               │   └── redis.ts       ← ioredis (standalone/cluster)
│               ├── cache/
│               │   └── testCache.ts   ← get/set/invalidate + analytics
│               ├── middleware/
│               │   ├── authenticate.ts ← JWT verification
│               │   └── errorHandler.ts ← Global error handler
│               ├── controllers/
│               │   └── test.controller.ts ← getTest, getLive, cacheStats
│               ├── routes/
│               │   └── test.routes.ts  ← All route definitions
│               ├── services/
│               │   └── test.service.ts ← Cache-first business logic
│               └── validation/
│                   └── test.validation.ts ← Zod UUID schema
│
├── frontend/
│   ├── index.html                     ← HTML entry point
│   ├── vite.config.js                 ← Proxy /api → localhost:80
│   ├── package.json
│   └── src/
│       ├── main.jsx                   ← React 18 root
│       ├── App.jsx                    ← Router + all routes
│       ├── index.css                  ← Design system (CSS variables)
│       ├── api/
│       │   └── client.js              ← Fetch wrapper with JWT auth
│       ├── context/
│       │   └── AuthContext.jsx        ← Auth state management
│       ├── components/
│       │   ├── Navbar.jsx             ← Dynamic nav (auth-aware)
│       │   ├── Navbar.css
│       │   └── ProtectedRoute.jsx     ← Route guard
│       └── pages/
│           ├── LoginPage.jsx + .css   ← Login / Register
│           ├── DashboardPage.jsx+.css ← Overview + stats
│           ├── LiveTestPage.jsx       ← Current live test
│           ├── TestPage.jsx + .css    ← Take test UI
│           ├── SubmitPage.jsx         ← Submit to external API
│           ├── VideosPage.jsx + .css  ← Video library
│           ├── VideoPlayerPage.jsx    ← CDN video player
│           ├── ResultsPage.jsx        ← Test results history
│           ├── LoadTestPage.jsx+.css  ← 20k request simulator
│           └── RedisPage.jsx + .css   ← Cache analytics dashboard
```

---

## 15. API Reference

### Auth Service (port 3001)

```
POST /api/auth/register
  Body: { "email": "...", "name": "...", "password": "..." }
  Response: { "data": { "token": "...", "user": { id, email, name } } }

POST /api/auth/login
  Body: { "email": "...", "password": "..." }
  Response: { "data": { "token": "...", "user": { id, email, name } } }

GET /api/auth/me
  Headers: Authorization: Bearer <token>
  Response: { "data": { id, email, name } }

GET /api/auth/health
  Response: { "status": "ok", "service": "auth-service" }
```

### Dashboard Service (port 3002)

```
GET /api/student/profile          → Student details + stats
GET /api/student/results          → Test result history
GET /api/student/sessions         → Active sessions
GET /api/student/upcoming-tests   → Upcoming scheduled tests
GET /api/student/health           → Health check
```

### Test Service (port 3003)

```
GET /api/test/health              → Health check (no auth)
GET /api/test/cache/stats         → Real-time Redis analytics (auth)
POST /api/test/cache/reset        → Reset cache counters (auth)
GET /api/test/live                → Current live test (auth)
GET /api/test/:testId             → Test with questions (auth, cached)
POST /api/test/:testId/submit     → Submit answers (auth, stub 501)
```

---

## 16. Environment Variables

### Auth Service

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | HTTP port |
| `NODE_ENV` | `development` | Environment |
| `DATABASE_URL` | — | PostgreSQL connection (xenia_auth) |
| `JWT_SECRET` | — | JWT signing secret |
| `JWT_EXPIRES_IN` | `24h` | Token expiry |
| `CORS_ORIGIN` | — | Allowed origins |

### Dashboard Service

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3002` | HTTP port |
| `NODE_ENV` | `development` | Environment |
| `DATABASE_URL` | — | PostgreSQL connection (xenia_dashboard) |
| `JWT_SECRET` | — | JWT signing secret |
| `CORS_ORIGIN` | — | Allowed origins |

### Test Service

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3003` | HTTP port |
| `NODE_ENV` | `development` | Environment |
| `DATABASE_URL` | — | PostgreSQL connection (xenia_tests) |
| `REDIS_MODE` | `standalone` | `standalone` or `cluster` |
| `REDIS_URL` | `redis://localhost:6379` | Redis URL |
| `REDIS_CLUSTER_NODES` | — | Comma-separated `host:port` pairs |
| `JWT_SECRET` | — | JWT signing secret |
| `CACHE_TEST_TTL` | `600` | Test cache TTL in seconds |
| `CACHE_TEST_META_TTL` | `1800` | Metadata cache TTL |
| `CORS_ORIGIN` | — | Allowed origins |

---

## 17. Setup & Deployment

### Prerequisites

| Tool | Version | Required |
|------|---------|----------|
| Git | Any | Yes |
| Docker Desktop | Latest | Yes (must be running) |
| Node.js | 20+ | Yes (for frontend) |

### Quick Start

```bash
# 1. Clone
git clone https://github.com/KshitijDatir/EduNiti.git
cd EduNiti

# 2. Start backend (builds all containers, ~2-3 min first time)
cd backend
docker-compose up -d --build

# 3. Verify all services are healthy
docker-compose ps

# 4. Start frontend
cd ../frontend
npm install
npm run dev

# 5. Open http://localhost:5173
# 6. Register a new account and explore
```

### Useful Commands

```bash
# View logs
docker-compose logs test-service --tail=50
docker-compose logs -f  # Follow all logs

# Restart a single service
docker-compose up -d --build test-service

# Shell into a container
docker-compose exec test-service sh

# Connect to PostgreSQL
docker-compose exec postgres psql -U xenia -d xenia_tests

# Connect to Redis CLI
docker-compose exec redis redis-cli

# Check Redis cached keys
docker-compose exec redis redis-cli KEYS "test:*"

# Re-seed database
docker-compose exec test-service npx tsx prisma/seed.ts

# Complete reset (deletes all data)
docker-compose down -v
docker-compose up -d --build
```

---

## 18. Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| NGINX won't start | Waiting for services to be healthy | Run `docker-compose ps`, wait for health checks |
| Auth service unhealthy | `wget` not found in `node:20-slim` | Fixed: uses `curl` (explicitly installed) |
| Port 80 in use | IIS or another service | `net stop w3svc` (Windows) |
| Port 5173 in use | Another Vite instance | Kill the process or change port |
| `npm install` fails | Corrupted `node_modules` | Delete `node_modules` + `package-lock.json`, retry |
| Docker build slow | First build downloads base images | Subsequent builds use cache |
| `bcrypt` compile error | Native C++ deps on slim image | Fixed: uses `bcryptjs` (pure JS) |
| CORS errors in browser | Origin not in allowed list | Check `CORS_ORIGIN` env var and `nginx.conf` map |
| PowerShell JSON escaping | Quotes stripped by PowerShell | Write JSON to temp file, use `curl.exe -d @file` |

---

## 19. Design Decisions & Tradeoffs

### Architecture Choices

| Decision | Alternative | Why We Chose This |
|----------|-------------|-------------------|
| Microservices | Monolith | Each team member works on a separate service independently |
| 3 PostgreSQL databases | 1 shared database | Service isolation — each service owns its data |
| Redis standalone (dev) | Redis Cluster | Simpler for local dev, code supports cluster mode |
| NGINX (not API Gateway) | Kong, Traefik | Lightweight, well-documented, zero vendor lock-in |
| JWT (not sessions) | Server-side sessions | Stateless, no shared session store needed between services |
| bcryptjs (not bcrypt) | bcrypt native | Avoids C++ compilation in Docker slim images |
| sessionStorage (not localStorage) | localStorage | Token cleared on tab close, slightly more secure |
| Vite (not CRA) | Create React App | CRA is deprecated, Vite is 10x faster |
| Vanilla CSS (not Tailwind) | Tailwind CSS | Full design control, no build-time CSS dependency |
| Fetch API (not Axios) | Axios | Zero dependency, native browser API sufficient |

### Security Choices

| Decision | Reasoning |
|----------|-----------|
| `isCorrect` excluded from API | Students cannot see correct answers via API inspection |
| Shared JWT secret | All services verify tokens without calling auth service |
| Rate limiting at NGINX | Prevents brute force and DoS at the gateway level |
| CORS restricted | Only `localhost:5173` and `localhost` can call the API |
| No `KEYS *` command | Uses `SCAN` instead, safe for production Redis |

---

## 20. Future Roadmap

### High Priority

- [ ] **Real submission processing** — Score answers, store results
- [ ] **Admin dashboard** — Create/edit/delete tests and questions
- [ ] **Redis Cluster** — 3-node cluster for high availability (code supports this)

### Medium Priority

- [ ] **Kubernetes deployment** — Replace Docker Compose for production
- [ ] **CI/CD pipeline** — GitHub Actions for automated testing and deployment
- [ ] **WebSocket** — Real-time test session updates
- [ ] **Google OAuth** — Social login (passport-google-oauth20)

### Low Priority

- [ ] **Prometheus + Grafana** — Production monitoring
- [ ] **ELK Stack** — Centralized logging
- [ ] **Rate limiting per user** — Instead of per IP
- [ ] **Test timer** — Countdown with auto-submit
