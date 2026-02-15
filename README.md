# EduNiti

A scalable learning platform built with a modern microservices architecture, designed for high performance and reliability.

## Key Features

- **Student Dashboard**: Track learning progress, view history, and manage active sessions.
- **Live Assessment**: Real-time timed examinations with immediate feedback.
- **Optimized Content**: High-performance video learning delivered via AWS CloudFront CDN.
- **Microservices Backend**: independent services for Auth, Dashboard, and Testing.
- **Performance First**: Sub-millisecond data retrieval using Redis caching and cache-first strategies.

## Technology Stack

- **Frontend**: React (Vite), Vanilla CSS Custom Design System
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (Prisma ORM) with Multi-Database architecture
- **Caching**: Redis (Cluster-ready)
- **Infrastructure**: NGINX API Gateway, Docker Compose, AWS CloudFront

## Quick Start

### Prerequisites
- Node.js (v20+)
- Docker Desktop

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/KshitijDatir/EduNiti.git
   cd EduNiti
   ```

2. **Start Backend Infrastructure**
   ```bash
   cd backend
   docker-compose up -d --build
   ```
   *Waits for services (Auth, Dashboard, Test) and databases (Postgres, Redis) to be healthy.*

3. **Start Frontend Client**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

