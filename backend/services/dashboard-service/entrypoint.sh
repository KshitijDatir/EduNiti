#!/bin/sh
set -e

echo "🔄 Pushing Prisma schema to database..."
npx prisma db push --skip-generate

echo "🌱 Seeding database..."
node dist/prisma/seed.js 2>/dev/null || npx tsx prisma/seed.ts

echo "📊 Starting dashboard-service..."
exec node dist/server.js
