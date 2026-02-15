# EduNiti

A scalable learning platform with microservices backend and React frontend.

---

## Prerequisites

Install these on your friend's laptop before starting:

| Tool | Version | Download |
|------|---------|----------|
| **Git** | Any | https://git-scm.com/downloads |
| **Docker Desktop** | Latest | https://www.docker.com/products/docker-desktop |
| **Node.js** | 20+ | https://nodejs.org |

> Make sure Docker Desktop is **running** before proceeding.

---

## Setup Steps

### 1. Clone the repository

```bash
git clone https://github.com/KshitijDatir/EduNiti.git
cd EduNiti
```

### 2. Start the backend

```bash
cd backend
docker-compose up -d --build
```

This will:
- Build all services (auth, dashboard, test, NGINX)
- Start PostgreSQL and Redis
- Run database migrations and seed data
- Start NGINX gateway on **port 80**

Wait until all containers are healthy (~2-3 minutes on first run):

```bash
docker-compose ps
```

All services should show `healthy` status.

### 3. Start the frontend

```bash
cd ../frontend
npm install
npm run dev
```

Frontend will be available at **http://localhost:5173**

---

## Usage

1. Open **http://localhost:5173** in a browser
2. **Register** a new account (any email/password)
3. Explore: Dashboard, Live Test, Videos, Results, Load Test

---

## Architecture

```
frontend (React + Vite, port 5173)
  |
  |-- /api/* proxied to -->  NGINX (port 80)
                               |
                               |-- /api/auth/*      --> auth-service (3001)
                               |-- /api/student/*   --> dashboard-service (3002)
                               |-- /api/test/*      --> test-service (3003)
                               |
                             PostgreSQL (5432)  +  Redis (6379)
```

---

## Environment

No `.env` files needed for local dev — all config is in `docker-compose.yml`.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| NGINX won't start | Run `docker-compose ps` — wait for auth-service to be `healthy` first |
| Port 80 in use | Stop whatever is using port 80 (e.g. IIS on Windows: `net stop w3svc`) |
| Port 5173 in use | Kill the other process or change port in `vite.config.js` |
| `npm install` fails | Delete `node_modules` and `package-lock.json`, then retry |
| Docker build slow | First build downloads images, subsequent builds are cached |