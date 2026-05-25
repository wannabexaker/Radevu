# Radevu

Booking SaaS platform for small service businesses. Each business gets a branded subdomain, a service catalog, a public booking page, and a mobile-first 6-tab dashboard.

Brand domain: `radevu.gr` (pending registration).

## Stack

Next.js 15 (App Router) · TypeScript strict · PostgreSQL 16 · Redis 7 · Prisma · better-auth · Tailwind · Resend. Docker + Coolify. pnpm workspaces. Node 22 LTS.

## Layout

```
apps/web         Single Next.js app — public booking + owner dashboard
packages/db      Prisma schema + generated client
packages/email   React Email templates + Resend sender
packages/shared  Shared types + zod schemas + utilities
infra/           Docker Compose, Coolify setup, backup scripts, cloudflared config
docs/            MASTER_VISION, ARCHITECTURE, API, CODEX_TASKS
.claude/         Orchestrator instructions for Claude Code
```

## Hosting phases

- **Beta Phase 0** (current): Raspberry Pi 4 8GB at home, LAN-only via `radevu.local`. Subpath routing.
- **Beta Phase 1**: + Cloudflare Tunnel + `radevu.gr` domain. Subdomain routing.
- **Production**: Hetzner CAX21 (~€7/mo) at 20+ real users.

See `infra/SETUP.md` for the Pi 4 bring-up runbook.

## Local development (on your dev machine, not the Pi)

```
pnpm install
docker compose -f infra/docker-compose.yml up -d postgres redis
pnpm --filter @radevu/web dev
```

Open `http://localhost:3000/<business-slug>` (subpath mode) for public pages, `http://localhost:3000/dashboard` for owner.

## Phase

**MVP — Phase 1.** See `docs/CODEX_TASKS.md` for the task queue.
