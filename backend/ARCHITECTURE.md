# Xenia Backend — Architecture & Setup Guide

> A beginner-friendly guide to understanding, running, and extending the Xenia backend.

---

## Table of Contents

1. [What Is This?](#1-what-is-this)
2. [The Big Picture](#2-the-big-picture)
3. [Key Technologies Explained](#3-key-technologies-explained)
4. [Project Structure](#4-project-structure)
5. [How Each Service Works](#5-how-each-service-works)
6. [How to Run Everything](#6-how-to-run-everything)
7. [How to Test Everything](#7-how-to-test-everything)
8. [What Was Built & Fixed](#8-what-was-built--fixed)
9. [Next Steps](#9-next-steps)

---

## 1. What Is This?

Xenia (NeuraMach.AI) is a learning platform where students can take tests. This backend handles:

- **Authentication** — Students log in, get a token (JWT)
- **Dashboard** — Students see their profile, results, sessions, upcoming tests
- **Test Fetching** — When a student opens a test, the backend fetches questions **from Redis** (fast) or **from PostgreSQL** (if Redis doesn't have it yet)

The backend is built as **microservices** — small, independent applications that each handle one job. They all sit behind a **reverse proxy** (NGINX) that routes requests to the right service.

---

## 2. The Big Picture

Here's how a request flows from the student's browser to the backend and back:

```
┌──────────┐     ┌──────────┐     ┌─────────────────────────┐
│ Frontend │────▶│   CDN    │────▶│    NGINX (port 80)      │
│ (React)  │     │          │     │    Reverse Proxy         │
└──────────┘     └──────────┘     └────────┬────┬────┬───────┘
                                           │    │    │
                              ┌────────────┘    │    └────────────┐
                              ▼                 ▼                 ▼
                       ┌─────────────┐  ┌──────────────┐  ┌─────────────┐
                       │ auth-service │  │  dashboard   │  │ test-service│
                       │  (port 3001) │  │  (port 3002) │  │ (port 3003) │
                       └─────────────┘  └──────────────┘  └──────┬──────┘
                                                                 │
                                                         ┌───────┴───────┐
                                                         ▼              w ▼
                                                    ┌─────────┐   ┌───────────┐
                                                    │  Redis  │   │ PostgreSQL│
                                                    │ (cache) │   │ (database)│
                                                    └─────────┘   └───────────┘
```

**How NGINX routes requests:**

| URL Pattern | Goes To | Service |
|---|---|---|
| `/api/auth/*` | `auth-service:3001` | Handles login, OAuth |
| `/api/student/*` | `dashboard-service:3002` | Profile, results, sessions |
| `/api/test/*` | `test-service:3003` | **Fetch test questions** |

---

## 3. Key Technologies Explained

### Docker & Docker Compose

**What is Docker?**
Docker packages your app + all its dependencies into a "container" — a lightweight, isolated box that runs the same way on any machine. No more "it works on my machine" problems.

**What is Docker Compose?**
When you have multiple services (NGINX, auth, dashboard, test, Postgres, Redis), starting each one individually is tedious. Docker Compose lets you define all services in one file (`docker-compose.yml`) and start everything with a single command.

**Key concepts:**
- **Image** — A blueprint for a container (like a recipe)
- **Container** — A running instance of an image (like the actual dish)
- **Dockerfile** — Instructions to build an image (like writing the recipe)
- **Volume** — Persistent storage so data survives container restarts

### Redis

**What is Redis?**
Redis is an **in-memory database** — it stores data in RAM, which makes it extremely fast (microseconds vs milliseconds for traditional databases).

**Why do we use it?**
When 100 students open the same test at the same time, we don't want to hit PostgreSQL 100 times. Instead:

1. **First student** → Redis doesn't have the test → fetch from PostgreSQL → store in Redis → return
2. **Students 2-100** → Redis has the test → return instantly from memory

This is called **caching**. Our cache has a TTL (Time To Live) of 600 seconds (10 minutes), meaning after 10 minutes, the cache expires and the next request fetches fresh data from PostgreSQL.

### NGINX

**What is NGINX?**
NGINX is a **reverse proxy** — it sits in front of your backend services and routes incoming requests to the correct service based on the URL.

**Why not just expose each service directly?**
- **Single entry point** — The frontend only talks to one URL (`http://localhost`)
- **Load balancing** — If you have 3 copies of test-service, NGINX distributes requests evenly
- **Rate limiting** — Prevents abuse (10 requests/second per IP)
- **CORS handling** — Manages cross-origin headers in one place

### PostgreSQL

**What is PostgreSQL?**
A relational database that stores data permanently on disk. Unlike Redis (which is fast but temporary), Postgres is the "source of truth" for all test questions, options, and answers.

### Prisma

**What is Prisma?**
An ORM (Object-Relational Mapper) for Node.js. Instead of writing raw SQL like `SELECT * FROM "Test" WHERE id = '...'`, you write:

```typescript
prisma.test.findUnique({ where: { id: testId } })
```

Prisma also handles:
- **Schema definition** — `schema.prisma` defines your tables
- **Migrations** — Tracks database changes over time
- **Type safety** — TypeScript knows exactly what fields exist

### JWT (JSON Web Token)

**What is JWT?**
A secure token that proves "this user has logged in." The flow:

1. Student logs in with email + password
2. Auth service creates a JWT (a long encoded string) containing the user's ID
3. Frontend stores this token in memory
4. Every subsequent request includes `Authorization: Bearer <token>`
5. Backend services verify the token before responding

---

## 4. Project Structure

```
backend/
├── docker-compose.yml          ← Defines all 6 services
├── nginx/
│   └── nginx.conf              ← NGINX routing rules
│
├── services/
│   ├── auth-service/           ← Login & OAuth (STUB)
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/server.ts       ← Single file, issues JWTs
│   │
│   ├── dashboard-service/      ← Student data (STUB)
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/server.ts       ← Returns mock profile/results/sessions
│   │
│   └── test-service/           ← REAL IMPLEMENTATION
│       ├── Dockerfile          ← Multi-stage Docker build
│       ├── entrypoint.sh       ← Auto-runs DB setup + seed on start
│       ├── package.json
│       ├── tsconfig.json
│       ├── prisma/
│       │   ├── schema.prisma   ← Database schema (Test, Question, Option)
│       │   └── seed.ts         ← Seeds 3 sample tests with questions
│       └── src/
│           ├── server.ts       ← Entry point: connects DB + Redis, starts app
│           ├── app.ts          ← Express setup: middleware, routes, error handling
│           ├── config/
│           │   ├── env.ts      ← Validates environment variables with Zod
│           │   ├── database.ts ← Prisma client singleton
│           │   └── redis.ts    ← Redis/Cluster client with retry strategies
│           ├── cache/
│           │   └── testCache.ts ← Redis get/set/invalidate with TTL
│           ├── middleware/
│           │   ├── authenticate.ts ← JWT verification middleware
│           │   └── errorHandler.ts ← Global error handler
│           ├── controllers/
│           │   └── test.controller.ts ← GET /api/test/:testId handler
│           ├── routes/
│           │   └── test.routes.ts ← Route definitions
│           ├── services/
│           │   └── test.service.ts ← Cache-first fetch logic
│           └── validation/
│               └── test.validation.ts ← Zod schema for testId
```

---

## 5. How Each Service Works

### test-service (The Real One)

This is the core service you built. Here's exactly what happens when a student opens a test:

```
Student clicks "Start Test"
       │
       ▼
Frontend sends: GET /api/test/abc-123
  with header: Authorization: Bearer <JWT>
       │
       ▼
NGINX receives request, sees /api/test/* → forwards to test-service:3003
       │
       ▼
authenticate.ts middleware:
  - Extracts JWT from Authorization header
  - Verifies signature using shared secret
  - Extracts userId from token
  - If invalid → 401 Unauthorized
       │
       ▼
test.controller.ts:
  - Validates testId format (must be UUID)
  - Calls getTestById(testId)
       │
       ▼
test.service.ts → getTestById():
  1. Check Redis: "Do we have test:abc-123 cached?"
     ├── YES (Cache HIT) → Return cached data immediately
     └── NO (Cache MISS) → Continue to step 2
  2. Query PostgreSQL for the test + questions + options
     - Important: isCorrect field is EXCLUDED (students can't see answers)
  3. Store result in Redis with 600s TTL
  4. Return the data
       │
       ▼
Response sent back through NGINX to the student:
{
  "data": {
    "id": "abc-123",
    "title": "JavaScript Fundamentals",
    "questions": [
      {
        "id": "q-1",
        "questionText": "What does === check?",
        "options": [
          { "id": "opt-1", "text": "Value only" },
          { "id": "opt-2", "text": "Value and type" }
        ]
      }
    ]
  }
}
```

### dashboard-service (The Real One)

Now a fully functional service. It connects to the `xenia_dashboard` database and provides:
- **Profile:** Student details (`GET /api/student/profile`)
- **Results:** Exam history (`GET /api/student/results`)
- **Sessions:** Active test sessions (`GET /api/student/sessions`)
- **Upcoming Tests:** Scheduled exams (`GET /api/student/upcoming-tests`)

### auth-service (The Real One)

Now a fully functional service. It:
- Connects to the `xenia_auth` database
- Stores **hashed passwords** (used `bcryptjs` for performance optimization)
- Implements:
  - `POST /api/auth/register` — Create new account
  - `POST /api/auth/login` — Verify credentials & issue JWT
  - `GET /api/auth/me` — Verify token & return user details
  - `GET /api/auth/health` — Service health check


---

## 6. How to Run Everything

### Prerequisites

- **Docker Desktop** installed and running
- That's it! Docker handles everything else.

### Start the entire stack

```bash
cd d:\Projects\Xenia\backend
docker-compose up --build
```

This single command:
1. Pulls base images (Node.js, Postgres, Redis, NGINX)
2. Builds all 3 service images from their Dockerfiles
3. Creates a private network so services can talk to each other
4. Starts PostgreSQL and Redis first (other services depend on them)
5. Starts auth-service, dashboard-service, test-service
6. test-service auto-runs `prisma db push` (creates tables) + seed (inserts sample data)
7. Starts NGINX last (waits for all services to be healthy)

### Stop everything

```bash
docker-compose down
```

### Stop and delete all data (fresh start)

```bash
docker-compose down -v
```

The `-v` flag removes volumes (Postgres data, Redis data).

---

## 7. How to Test Everything

Once `docker-compose up --build` is running and you see health check logs, open a new terminal:

### Step 1: Health checks

```powershell
curl.exe -s http://localhost/health
# → {"status":"ok","service":"nginx-gateway"}

curl.exe -s http://localhost/api/auth/health
# → {"status":"ok","service":"auth-service-stub"}

curl.exe -s http://localhost/api/test/health
# → {"status":"ok","service":"test-service","timestamp":"..."}
```

### Step 2: Log in and get a JWT

```powershell
# Create a JSON file for the request body (PowerShell workaround)
$body = '{"email":"demo@xenia.ai","password":"demo123"}'
[System.IO.File]::WriteAllText("$env:TEMP\login.json", $body)

# Login
curl.exe -s -X POST http://localhost/api/auth/login -H "Content-Type: application/json" -d "@$env:TEMP\login.json"
```

You'll get back:
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "id": "user-001", "email": "demo@xenia.ai", "name": "Demo Student" }
  }
}
```

### Step 3: Fetch a test

```powershell
# Get token and fetch a test in one go
$response = curl.exe -s -X POST http://localhost/api/auth/login -H "Content-Type: application/json" -d "@$env:TEMP\login.json"
$token = ($response | ConvertFrom-Json).data.token

# Get test IDs from the database
echo 'SELECT id, title FROM "Test";' | docker-compose exec -T postgres psql -U xenia -d xenia_tests -t -A

# Fetch a test (replace TEST_ID with an actual ID from above)
curl.exe -s http://localhost/api/test/TEST_ID -H "Authorization: Bearer $token"
```

### Step 4: Verify Redis caching

```powershell
# Hit the same test twice, then check logs
curl.exe -s http://localhost/api/test/TEST_ID -H "Authorization: Bearer $token" | Out-Null
curl.exe -s http://localhost/api/test/TEST_ID -H "Authorization: Bearer $token" | Out-Null

docker-compose logs test-service --tail=10
```

You should see:
```
📦 Cache MISS for test:TEST_ID — querying database    ← 1st request
📝 Cached test:TEST_ID (TTL: 600s)                    ← stored in Redis
🎯 Cache HIT for test:TEST_ID                          ← 2nd request (from Redis!)
```

### Step 5: Inspect Redis directly

```powershell
docker-compose exec redis redis-cli
```

Then inside the Redis CLI:
```
KEYS test:*                     # See all cached tests
GET test:<TEST_ID>              # See the cached JSON
TTL test:<TEST_ID>              # See remaining TTL in seconds
```

---

## 8. What Was Built & Fixed

### Already existed (from previous sessions)
- Full `test-service` with Redis caching, Postgres, JWT auth, Zod validation
- `auth-service` and `dashboard-service` stubs
- NGINX config with routing rules
- `docker-compose.yml` with all 6 services
- Prisma schema + seed data

### Fixed in this session

| Issue | Fix |
|-------|-----|
| `npm ci` failed — no `package-lock.json` in any service | Generated lockfiles for all 3 services |
| NGINX crashed — `add_header` inside `if` block | Moved CORS headers into `location` blocks |
| Manual DB setup — had to run `prisma migrate` by hand | Created `entrypoint.sh` to auto-push schema + seed on start |
| Dockerfile missing seed + entrypoint | Updated to include `entrypoint.sh`, seed file, and tsx for seeding |

---

## 9. Next Steps

### High Priority — Replace Stubs with Real Services

1. **Real Auth Service**
   - Replace `auth-service` stub with a real service that:
     - Stores hashed passwords (use `bcrypt`)
     - Connects to a `users` database
     - Implements real Google OAuth (use `passport-google-oauth20`)
     - Handles user registration (`POST /api/auth/register`)

2. **Real Dashboard Service**
   - Replace `dashboard-service` stub with a real service that:
     - Queries the users database for profile data
     - Queries a results database for exam scores
     - Tracks active sessions
     - Returns real upcoming tests (can query the same Postgres as test-service)

### Medium Priority — Features

3. **Test Submission Endpoint**
   - Add `POST /api/test/submit` to test-service
   - Accepts `{ testId, answers: [{ questionId, selectedOption }] }`
   - Scores answers against correct options in DB
   - Stores results for the dashboard to display

4. **Admin API**
   - Create/update/delete tests and questions
   - Invalidate Redis cache when questions change (the `invalidateCachedTest()` function already exists)

### Low Priority — Production Readiness

5. **Redis Cluster** — Switch from standalone Redis to a 3-node cluster for high availability (the code already supports this via `REDIS_MODE=cluster`)

6. **Kubernetes** — Deploy to K8s instead of Docker Compose for production scaling

7. **CI/CD** — Automate testing and deployment with GitHub Actions

8. **Monitoring** — Add Prometheus metrics and Grafana dashboards

9. **Logging** — Centralize logs with ELK stack or similar

---

## Quick Reference

### Environment Variables (test-service)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3003` | HTTP port |
| `NODE_ENV` | `development` | Environment mode |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `REDIS_MODE` | `standalone` | `standalone` or `cluster` |
| `REDIS_URL` | `redis://localhost:6379` | Redis URL (standalone mode) |
| `REDIS_CLUSTER_NODES` | — | Comma-separated `host:port` pairs (cluster mode) |
| `JWT_SECRET` | — | Shared secret for JWT verification |
| `CACHE_TEST_TTL` | `600` | How long to cache a test in Redis (seconds) |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origins |

### Useful Commands

```bash
# Start everything
docker-compose up --build

# Stop everything
docker-compose down

# Fresh start (delete all data)
docker-compose down -v

# View logs for a specific service
docker-compose logs test-service --tail=50

# Open a shell inside a container
docker-compose exec test-service sh

# Connect to Postgres
docker-compose exec postgres psql -U xenia -d xenia_tests

# Connect to Redis
docker-compose exec redis redis-cli

# Rebuild just one service
docker-compose up --build test-service
```
