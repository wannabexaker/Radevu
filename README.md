# Radevu

**Multi-tenant booking SaaS for small service businesses.** Every business gets a branded mini-site, a public booking page, a lightweight CRM, and a mobile-first 6-tab dashboard — set up in minutes, used in seconds.

> Status: **Phase 1 MVP — live demo at [radevu.olamov.com](https://radevu.olamov.com)**.
> Hosted self-managed on a single Raspberry Pi 4 behind Cloudflare Tunnel. Designed to migrate to Hetzner Cloud (~€10/mo) when the user count justifies it.

---

## What it does

| Surface | URL pattern | Audience |
|---------|-------------|----------|
| Landing + showcase | `/` | Anyone discovering the product |
| Public business profile | `/<business-slug>` | Customers ready to book |
| Owner dashboard | `/dashboard/*` | The business owner |

End-to-end booking takes **under 60 seconds** on a mid-range Android over 4G — verified by a Playwright e2e test that fails the build if the budget is breached. Bookings fire confirmation + calendar-invite (`.ics`) emails to the customer and an alert to the owner. A Redis-backed worker sends a reminder 24 hours before the appointment.

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 15 (App Router, standalone) | Single app, dual routing (subdomain or subpath via env) |
| Language | TypeScript strict end-to-end | `noUncheckedIndexedAccess`, no `any` without justification |
| DB | PostgreSQL 16 + Prisma | `schema.prisma` is the contract everything else derives from |
| Cache / queues | Redis 7 | Sessions, rate limit, reminder ZSET with atomic Lua claim |
| Auth | better-auth | Email/password, Prisma adapter, owner-only accounts |
| Email | Resend + React Email | `.ics` attachment, fire-and-forget per booking |
| Styling | Tailwind + shadcn-style primitives | Mobile-first at 360×800, tap targets ≥44px |
| Container | Docker + docker-compose | Build on amd64 (GitHub Actions), run on ARM64 (Pi) — multi-stage with `--platform=$BUILDPLATFORM` |
| Edge | Cloudflare Tunnel | No port forwarding, no public IP, free-tier DDoS shield |

No new dependency was added without explicit justification — the whole `package.json` is small on purpose.

## Layout

```
apps/web              Single Next.js 15 app — public booking + owner dashboard + API
packages/db           Prisma schema + generated client + idempotent seed
packages/email        React Email templates (confirmation, owner alert, reminder) + ics generator
packages/shared       zod schemas, DTO types, datetime helpers, constants
infra/                Docker Compose (dev/prod/pi), Dockerfile reference, backup script, cloudflared template
docs/                 Vision, architecture, API reference, design tokens, runbooks (Cloudflare, migration, portfolio)
scripts/              Pi update script (mirrors the Eye_in_the_Sky pattern)
codex/                Per-chunk handoff briefs used during the build (kept as a methodology audit trail)
.claude/              Orchestrator instructions for Claude Code
.github/workflows/    Multi-arch build + push to GHCR on every commit to main
```

## Hosting phases

| Phase | Where | URL | Trigger to next |
|-------|-------|-----|-----------------|
| Beta Phase 0 | Raspberry Pi 4 at home, LAN-only via mDNS | `http://radevu.local:3000` | Custom domain available |
| **Beta Phase 1 (current)** | Same Pi + Cloudflare Tunnel | `https://radevu.olamov.com` | 20+ real users |
| Production | Hetzner CAX21 + Storage Box | `https://radevu.olamov.com` (DNS swap) | Revenue / multi-region needs |

The same `docker-compose.prod.yml` runs in all three. Migration between hosts is documented in [`docs/MIGRATION.md`](docs/MIGRATION.md) and is essentially `scp` of two named volumes plus a Cloudflare Tunnel route swap.

## Local development

Requires Docker, Node 22, pnpm 9.

```bash
pnpm install
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d postgres redis
pnpm --filter @radevu/db migrate:dev
pnpm --filter @radevu/db exec prisma db seed   # creates 3 demo businesses
pnpm --filter @radevu/web dev
```

Then open:

- `http://localhost:3000/` — landing with showcase
- `http://localhost:3000/despoina` — sample tutor profile
- `http://localhost:3000/ioannis` — sample network-tech profile
- `http://localhost:3000/dashboard/login` — owner login (seeded credentials in `packages/db/prisma/seed.ts`)

## Deployment

### Build

GitHub Actions builds a `linux/arm64` image on every push to `main` and publishes it to `ghcr.io/<your-github-user>/radevu-web:latest`. The Pi never builds anything — it only pulls.

### Pi update (after a new image is published)

```bash
cd ~/projects/radevu
git pull
./scripts/pi-update.sh
```

The script shows current SHAs, pulls, recreates only changed services, waits for the healthcheck, and runs both a loopback and a public probe before exiting.

### Adding a new hostname to the existing tunnel

See [`docs/CLOUDFLARE.md`](docs/CLOUDFLARE.md). The summary: edit one YAML file (`/etc/cloudflared/config.yml`), validate, run `cloudflared tunnel route dns`, restart the systemd service. The catch-all `http_status:404` ingress rule must stay last.

## Documentation

| Doc | What |
|-----|------|
| [`docs/MASTER_VISION.md`](docs/MASTER_VISION.md) | Why this product exists — read first |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Boundaries, request flow, DB schema sketch, env table |
| [`docs/API.md`](docs/API.md) | Every public route with auth, body, response, error codes |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Color tokens, type scale, primitives, voice & tone (Greek copy rules) |
| [`docs/VERTICALS.md`](docs/VERTICALS.md) | Locked profession list for Phase 2 templates |
| [`docs/CODEX_TASKS.md`](docs/CODEX_TASKS.md) | Task queue + Phase 1 completion status |
| [`infra/SETUP.md`](infra/SETUP.md) | Raspberry Pi 4 bring-up runbook |
| [`docs/CLOUDFLARE.md`](docs/CLOUDFLARE.md) | Tunnel + Access + Bot Fight runbook |
| [`docs/MIGRATION.md`](docs/MIGRATION.md) | Pi → Hetzner playbook |
| [`docs/PORTFOLIO.md`](docs/PORTFOLIO.md) | Portfolio integration guide |

## Development methodology

This codebase was built chunk-by-chunk with Claude Code as orchestrator and OpenAI Codex CLI as the primary code writer, against a locked skill ([`booking-saas-project`](https://github.com/wannabexaker/Radevu/tree/main/.claude)) and an explicit per-chunk handoff in `codex/handoff-NNN.md`. Each handoff has a "no `ραντεβού` ambiguity" audit step — the word is anchored to either a service, a business, or a count, so the brand never drifts toward dating-app territory in Greek.

Phase 1 covers chunks #001 through #011; the queue tracking that work lives in `docs/CODEX_TASKS.md`.

## License

The source is not currently published under an open-source license. Treat it as **source-available**: you may read, learn from, and reference patterns; redistribution and commercial reuse are not granted. Open an issue if you want to talk licensing.

---

Built in Athens.
