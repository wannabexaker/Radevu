# Multi-stage Dockerfile for Radevu Web (Next.js 15, standalone output)
# Pattern adapted from Eye_in_the_Sky — proven on Raspberry Pi 4 ARM64.
#
# Stage 1 builds on the native CI platform (amd64 on GitHub Actions) to avoid
# QEMU SIGILL on cross-arch builds. The runtime stage is whatever the target
# platform is (arm64 for Pi 4, arm64 for Hetzner CAX21).

# ============================================================
# Stage 1: Builder
# ============================================================
FROM --platform=$BUILDPLATFORM node:22-alpine AS builder

WORKDIR /build

# openssl is needed by Prisma's binary engines during `prisma generate`.
# Installing it before pnpm install removes the runtime warning and ensures
# the correct engine variant is selected on Alpine.
RUN apk add --no-cache openssl

# pnpm matching the workspace's packageManager pin
RUN npm install -g pnpm@9.15.0

# Copy workspace skeleton (cached layer when only app code changes)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* tsconfig.base.json* ./

# Copy app + packages
COPY apps/web ./apps/web
COPY packages ./packages

# Install all workspace deps with frozen lockfile
RUN pnpm install --frozen-lockfile

# Generate Prisma client (needs schema in packages/db)
RUN pnpm --filter @radevu/db generate

# Build Next.js (standalone output configured in next.config.mjs)
WORKDIR /build/apps/web
RUN pnpm exec next build

# Trim cache from standalone output
RUN rm -rf .next/cache .next/static/webpack .next/server/chunks/webpack

# ============================================================
# Stage 2: Runtime (arm64 on Pi / Hetzner ARM)
# ============================================================
FROM node:22-alpine

WORKDIR /app

# curl for healthchecks; openssl for Prisma on Alpine
RUN apk add --no-cache curl openssl

# Copy Next standalone bundle — monorepo layout preserves apps/web/server.js
COPY --from=builder /build/apps/web/.next/standalone ./
COPY --from=builder /build/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /build/apps/web/public ./apps/web/public

# Copy Prisma migrations + schema so `prisma migrate deploy` can run at startup
COPY --from=builder /build/packages/db/prisma ./packages/db/prisma

# Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN mkdir -p /srv/radevu/uploads && chown -R nodejs:nodejs /srv/radevu /app
USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Standalone entrypoint (monorepo path)
CMD ["node", "apps/web/server.js"]
