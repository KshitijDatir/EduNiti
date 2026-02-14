#!/bin/sh
set -e

echo "🔄 generating prisma client..."
npx prisma generate

echo "🔄 Pushing Prisma schema to database..."
npx prisma db push --skip-generate

# echo "🌱 Seeding database..."
# node dist/prisma/seed.js 2>/dev/null || npx tsx prisma/seed.ts

echo "🔐 Starting auth-service..."
exec node dist/server.js
