# AGENTS.md — working brief for AI sessions on Radevu

The real instructions for anyone (human or AI) picking up this repo. `CLAUDE.md`
files point here. Read this before touching anything.

## What Radevu is

A mobile-first booking and customer-management SaaS for small Greek
service businesses (barbers, tutors, mechanics, and similar). A customer opens a
professional's public page on a phone, books a time as a guest, and gets an email
confirmation; the owner runs the day — schedule, customers, unpaid balances,
reminders — from a private dashboard. Booking and follow-up only: not a
marketplace, not a website builder, not a generic CRM.

## Where it runs

- **Live beta:** `https://radevu.olamov.com`, served from a Raspberry Pi at home,
  behind a Cloudflare Tunnel. Barely used; treat it as low-traffic but real.
- **Planned:** Pi beta → Hetzner production once the project becomes active again.
- Domain and routing are env-driven (`BOOKING_BASE_DOMAIN`, `ROUTING_MODE`) —
  never hardcode a hostname.

## Repository layout

pnpm workspace, Node ≥ 22, `pnpm@9.15.0`.

- `apps/web` — the Next.js 15 App Router application (all UI + API routes).
- `packages/db` — Prisma schema, migrations, seed.
- `packages/shared` — zod schemas, constants, shared helpers (consumed as TS
  source; note the `.js` import extensions).
- `packages/email` — React Email templates + Resend senders.
- `infra/` — Docker Compose files and ops scripts.
- `docs/` — `ARCHITECTURE.md`, `API.md`, `CLOUDFLARE.md`, `EMAIL_SETUP.md`.
- `.scratch/` — gitignored working files (plans, prompts, hand-offs, local creds).

## Stack

TypeScript (strict) · Next.js 15 · Prisma + PostgreSQL 16 · Redis 7 (ioredis) ·
better-auth · Tailwind only · Resend + React Email · Docker + GHCR (prebuilt
ARM64 images). No CSS modules, no inline styles, no new npm packages without a
clear reason.

## Commands

Run from the repo root. No global pnpm on the usual dev machine — use `corepack pnpm`.

```bash
corepack pnpm dev:infra        # start local Postgres (5433) + Redis (6379) in Docker
corepack pnpm dev              # run the web app on :3000
corepack pnpm typecheck        # tsc --noEmit across the workspace
corepack pnpm lint             # next lint
corepack pnpm test             # unit tests (node:test)
corepack pnpm test:e2e         # Playwright, tested at 360×800
corepack pnpm db:migrate:local # apply migrations to the local db
corepack pnpm db:seed:local    # seed local data
```

Local gotchas (full list in `README.md` and the memory notes): `BETTER_AUTH_URL`
must be `http://localhost:3000` locally or sign-in returns 403; stop the dev
server before `prisma generate` on Windows (it locks the query-engine DLL).

## How to work

- Do not start coding on sight. Ask the missing questions first, surface risks
  and contradictions, propose a short plan, and wait for approval.
- Read before editing. Match the surrounding code's style and idioms.
- Verify changes by actually running the affected flow, not just typecheck —
  there are unit and Playwright suites; use them.
- Keep the booking flow under 60 seconds and every screen usable at 360px.

## Non-negotiables

- TypeScript strict · Tailwind only · mobile-first at 360×800.
- 6-tab dashboard shell (Today · Appointments · Customers · Debts · Notifications
  · Settings) — never rearrange.
- The customer schema stays full from day one even where the UI shows a subset.
- **No API route change without updating `docs/API.md`.**
- **No new DB table or column without a schema review first.**
- Domain + routing always env-driven; never hardcode `radevu.gr` / a host.
- Scope guard: no marketplace, no website builder, no social features.

## Deploy

- Push to `main` → GitHub Actions builds the `linux/arm64` image → pushes to GHCR.
- On the Pi: `./update.sh` pulls the image, runs `prisma migrate deploy`, recreates
  the web container, and health-checks `/api/health`.
- **Do not touch the Pi unless the owner explicitly asks.** Deploys, SSH, and
  database changes on the Pi are owner-authorised actions, one at a time.

## Commit rules (owner's hard rule)

- **Never** add a `Co-Authored-By:` trailer or any "Generated with" / attribution
  line to a commit or PR, unless the owner explicitly asks for a specific one.
- One logical change per commit. Public repo — no secrets, no history rewrites,
  no force-push.

## License

Original work, all rights reserved — see `LICENSE`. Nothing here is open source.
