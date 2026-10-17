# Multi-stage Dockerfile for Personal Project Dashboard
# Target: Railway, Fly.io, or VPS (Self-hosted SQLite persistent volume)

FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@12.11.2 --activate

# 1. Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# 2. Rebuild the source code
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Run prisma generate
RUN npx prisma generate
# Build standalone output
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# 3. Production runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install openssl for Prisma engine
RUN apk add --no-cache openssl

# Create data directory for SQLite persistence
RUN mkdir -p /app/prisma/data && chown -R node:nodejs /app/prisma

# Copy standalone build and public assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=node:nodejs /app/.next/standalone ./
COPY --from=builder --chown=node:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=node:nodejs /app/prisma ./prisma
COPY --from=builder --chown=node:nodejs /app/node_modules/.pnpm ./node_modules/.pnpm

# Start script that ensures SQLite schema is up to date before launching server
COPY --chown=node:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

USER node
VOLUME ["/app/prisma/data"]

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
