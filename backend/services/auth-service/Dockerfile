# ── Builder ──────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
# Network is unstable, so we use npm install (no ci) with retries
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Runner ───────────────────────────────────────────────────────
FROM node:20-slim AS runner

# Install OpenSSL and curl (required for Prisma and healthcheck on Debian slim)
RUN apt-get update -y && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

# bcryptjs is pure JS, no native build tools needed!
# RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./
# Network is unstable, get prod deps with retries
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm install --omit=dev

# Copy Prisma client (generated) + schema + seed
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Copy compiled JS
COPY --from=builder /app/dist ./dist

# Copy entrypoint
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

# Need tsx for seeding (runs TypeScript seed file)
RUN npm install -g tsx

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
  CMD curl -f http://localhost:3001/api/auth/health || exit 1

CMD ["./entrypoint.sh"]
