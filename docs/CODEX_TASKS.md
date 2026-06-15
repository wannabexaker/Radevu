# Codex Task Queue — Phase 1 MVP

Legend: `[ ]` TODO · `[→]` IN PROGRESS · `[✓]` DONE · `[✗]` REJECTED

Each task, when activated, gets expanded inline with:
- **Files to create or modify** (closed list)
- **Input/output contract** (function signatures, route shapes, DB columns)
- **Acceptance criteria**

Codex receives one task at a time. Do not skip ahead.

---

## Module 0: Infrastructure bring-up

- [ ] **TASK-001:** Pi verification + first deploy. Pi already runs Docker + other apps (Pi-hole, Eye_in_the_Sky). Steps: free port 3000, set up `/srv/radevu/uploads`, configure UFW, clone repo, fill `.env`, run `docker compose -f infra/docker-compose.prod.yml pull && up -d`. See `infra/SETUP.md`. **Codex skipped** — this is human ops on the Pi.
- [✓] **TASK-002:** Infrastructure files in repo (Dockerfile, dev + prod compose, GHA workflow, .dockerignore). Done.

## Module 9: Launch readiness

- [✓] **TASK-025:** Demo businesses seed (Despoina + Ioannis). Done by Codex handoff #011.
- [✓] **TASK-026:** Container hardening pass (cap drop, no-new-privileges). Done by Codex handoff #011.
- [✓] **TASK-027:** Cloudflare + Portfolio + Migration runbooks. Done by Codex handoff #011.

Phase 1 MVP is launch-ready.

## Module 1: App skeleton + auth

- [✓] **TASK-003:** Next.js 15 app skeleton in `apps/web` — App Router, TypeScript strict, Tailwind, base layout, middleware (env-driven `ROUTING_MODE`). Done by Codex handoff #001.
- [✓] **TASK-004:** better-auth setup — Prisma adapter, email/password provider, session cookies. Done by Codex handoff #001.

## Module 2: Data model

- [✓] **TASK-005:** Prisma schema in `packages/db/prisma/schema.prisma` — Business, Service, Customer, Appointment, User + better-auth models. First migration committed: `20260519093431_init`. Done by Codex handoff #001.

## Module 3: Business + services

- [✓] **TASK-006:** Business registration API + form. `POST /api/v1/businesses` creates business + owner User. Single-form registration. Done by Codex handoff #001.

- [ ] **TASK-007:** Service catalog UI (Settings → Services tab in dashboard) — CRUD with one-tap actions.

## Module 4: Public booking page

- [✓] **TASK-008:** Public business profile page (SSR) — logo, photo, services, hours, contact, social, Maps link, sticky CTA. Done by Codex handoff #004.
- [✓] **TASK-009:** Booking flow component — service → date → slot → contact form → confirm. Must complete < 60s at 360px. Done by Codex handoff #004.
- [✓] **TASK-010:** Availability logic — working hours minus existing appointments, considers service duration, business timezone. Done by Codex handoff #004.
- [✓] **TASK-023:** Month calendar booking view + time hardening. Done by Codex handoff #008.

## Module 5: Dashboard (6-tab shell)

- [✓] **TASK-011:** Dashboard layout + sticky bottom nav (6 tabs). All tabs render route groups even if minimal. Done by Codex handoff #001.
- [✓] **TASK-012:** Today tab — full. Rolling program view with default 7 days, owner-selectable 14 days / 1 month, grouped by day, one-tap done/cancel. Done by Codex handoff #006; range selector added after live feedback.
- [✓] **TASK-013:** Appointments tab — full. Upcoming list, date filter, search. Done by Codex handoff #006.
- [✓] **TASK-014:** Customers tab — minimal. Auto-created from bookings, list + customer detail (past appointments). Done by Codex handoff #007.
- [✓] **TASK-015:** Debts tab — minimal. `paid` flag toggle, filter view. Done by Codex handoff #007.
- [✓] **TASK-016:** Notifications tab — settings toggles (confirmation, reminder, reminder lead time). Done by Codex handoff #010.
- [✓] **TASK-017:** Settings tab — profile editor (logo, photo, contact, social, hours). Done by Codex handoff #009.
- [✓] **TASK-028:** Appointment notes/messages split. Booking note is customer-visible, dashboard has owner-private notes, secure customer link supports private customer note and shared replies. Done after live feedback.

## Module 6: Notifications

- [✓] **TASK-018:** React Email templates in `packages/email` — BookingConfirmation (with .ics), OwnerNewBookingAlert, BookingReminder. Done by Codex handoffs #005 and #010.
- [✓] **TASK-019:** Resend sender wrapper + .ics generator (server-side). Done by Codex handoff #005.
- [✓] **TASK-020:** Reminder scheduler — Redis-backed delayed queue, worker tick every minute, sends 24h before by default. Done by Codex handoff #010.
- [✓] **TASK-024:** Reminder scheduler — chunk #10 implementation pass. Done by Codex handoff #010.

Phase 1 MVP feature work is COMPLETE. Remaining items are non-coding ops: Pi deploy, routing verification, domain purchase, and Cloudflare Tunnel.

## Module 7: Routing modes

- [ ] **TASK-021:** Middleware — env-driven `ROUTING_MODE`. Subpath mode for Beta Phase 0, subdomain for Beta Phase 1+. Both lookup business by slug and attach to request context.

## Module 8: Beta Phase 1 transition (when radevu.gr is registered)

- [ ] **TASK-022:** cloudflared install + tunnel config — DNS records for `radevu.gr` + wildcard `*.radevu.gr`. Switch env to `ROUTING_MODE=subdomain`, `BOOKING_BASE_DOMAIN=radevu.gr`. Smoke test from external network.

---

## Cross-cutting reminders for every task

- TypeScript strict. Tailwind only. No inline styles.
- Mobile-first at 360×800. Verify in Playwright before marking done.
- API routes under `/api/v1/...`. Tables `snake_case` plural. Columns `snake_case` singular.
- No new npm packages without approval. No new DB tables without schema review.
- No placeholder / TODO code presented as done.
- Domain + routing mode always env-driven (`BOOKING_BASE_DOMAIN`, `ROUTING_MODE`). Never hardcode `radevu.gr` or `radevu.local`.
