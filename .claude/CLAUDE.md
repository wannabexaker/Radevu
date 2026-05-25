# Radevu — Claude Code Orchestrator Instructions

## Session start
1. Read `docs/MASTER_VISION.md` — canonical product framing (don't skim).
2. Load skill `booking-saas-project` — operational spec, hosting phases, conventions, MVP scope.
3. Load skill `booking-saas-codex-context` when preparing a Codex handoff or reviewing Codex output.
4. Check `docs/CODEX_TASKS.md` for the current task queue.

Per `CLAUDE_START_PROMPT.md`: do not start coding · ask all missing questions · find risks and contradictions · wait for approval · never immediately build.

## My role
Claude Code = **orchestrator**. I plan, review, and coordinate.
Codex = **primary code writer**. I do NOT write large code blocks unless Codex is unavailable.

## Workflow per feature
1. Break feature into tasks → write to `docs/CODEX_TASKS.md`.
2. Hand Codex one task at a time with full context: file paths, function signatures, route shapes, acceptance criteria.
3. Review Codex output for: correctness · style (TS strict, Tailwind only) · security · mobile-first at 360px · MVP scope respect.
4. Merge approved code, update `docs/CODEX_TASKS.md`.
5. Run tests, report status.

## Task format in CODEX_TASKS.md
- `[ ]` Task ID + description
- Files to create or modify (closed list)
- Input/output contract
- Acceptance criteria
- Status: `[ ]` TODO · `[→]` IN PROGRESS · `[✓]` DONE · `[✗]` REJECTED

## Non-negotiables I enforce
- 6-tab dashboard shell (Today · Appointments · Customers · Debts · Notifications · Settings) — never rearrange.
- Full customer schema from day 1 (UI surfaces a subset; schema is full to avoid migrations later).
- Booking flow ≤ 60 seconds on Pi 4 testing harness.
- Dashboard: ≤ 2 taps to any action.
- Tailwind only — no CSS modules, no inline styles.
- Mobile-first at 360×800 (Samsung A baseline).
- "Mobile app in a browser" — sticky bottom nav, tap targets ≥44px, no hover states.
- No new DB tables without schema review.
- No API route changes without updating `docs/API.md`.
- No new npm packages without justification.
- Domain + routing mode always env-driven (`BOOKING_BASE_DOMAIN`, `ROUTING_MODE`) — never hardcode.
- No marketplace · no website builder · no social — see skill Section 6.

## Stack (locked — see `booking-saas-project` skill §2)
TS strict + Next.js 15 + Prisma + Postgres 16 + Redis 7 + better-auth + Tailwind + Resend. Docker + docker-compose + GHCR (pre-built ARM64 images, like Eye_in_the_Sky). pnpm workspaces. Node 22.

## Hosting (see skill §3)
- **Beta Phase 0 (now):** Raspberry Pi 4 8GB at home, Raspberry Pi OS 64-bit, SD card for now (USB SSD migration deferred), LAN-only via mDNS `radevu.local`, `ROUTING_MODE=subpath`. Images pulled from `ghcr.io/<user>/radevu-web:latest`, built by GitHub Actions.
- **Beta Phase 1:** + Cloudflare Tunnel + `radevu.gr` once domain registered, `ROUTING_MODE=subdomain`.
- **Production:** Hetzner CAX21 at 20+ real users, budget ≤ €30/mo.

## Deploy pattern (Eye_in_the_Sky-style)
- Push to `main` → GitHub Actions builds ARM64 image → pushes to GHCR.
- On Pi: `docker compose -f infra/docker-compose.prod.yml pull && up -d`. No build on the Pi.

## Pending external actions
- `radevu.gr` registration (papaki.gr, ~€10/year) → triggers Beta Phase 1.
- GitHub PAT for the github MCP → add to `.mcp.json` env when needed.

## Current Phase
**MVP — Phase 1.** Reject out-of-scope (see skill §6 Never list).
