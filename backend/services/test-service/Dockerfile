# ── Builder ──────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Runner ───────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy production deps only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

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

EXPOSE 3003

# Health check for Docker / K8s
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
  CMD wget -qO- http://localhost:3003/api/test/health || exit 1

CMD ["./entrypoint.sh"]
