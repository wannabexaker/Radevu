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

- [✓] **TASK-006:** Business registration API + form. Legacy business registration created business + owner User. Superseded by unified `/api/v1/auth/register` in Chunk #13. Done by Codex handoff #001.

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

## Module 11: Public auth + customer accounts + anti-spam (Chunk #13)

Plan reference: `~/.claude/plans/ok-quiet-feather.md`. Decisions locked: Cloudflare Turnstile + Redis rate limit + honeypot. Soft email verification (banner, not hard gate). Auto-backfill of guest Customer rows on email verification.

- [✓] **TASK-029:** Schema + migration + backfill. Add `User.userType` (enum customer|business_owner), `User.phone`, `User.marketingOptIn`, `Customer.userId` FK + index. SQL backfill sets existing owners to `business_owner`. Done + verified (3 demo owners flipped to `business_owner`, `customers.user_id` nullable + indexed + FK SetNull).
- [→] **TASK-030:** Security primitives. `apps/web/src/lib/security/{turnstile,rate-limit,honeypot}.ts` + `lib/auth-security.ts` wrapper + `tests/unit/security.test.ts`. Shared zod schemas in `packages/shared/src/api/auth.ts`. **Code written (uncommitted), pending review.**
- [→] **TASK-031:** Unified `/api/v1/auth/register` (discriminated customer|business) + `/api/v1/auth/verification/resend` + `EmailVerification` template + `lib/email-verification.ts` (token create/verify/send) + auto-backfill of `Customer.userId` on verification (email match only). **Code written (uncommitted), pending review.**
- [→] **TASK-032:** `(auth)` route group pages: `login`, `register` (segmented toggle), `verify-email`. `components/auth/Turnstile.tsx`. Old `/dashboard/{login,register}` → redirects. **Code written (uncommitted), pending review.**
- [→] **TASK-033:** `/api/v1/me/{route,appointments}` + `(account)` route group: `account`, `account/appointments`, `account/appointments/[id]`, `account/settings`. **Code written (uncommitted), pending review. NOTE: `me/change-password` NOT built — moved to TASK-038.**
- [→] **TASK-034:** Header session awareness, dropdown, Σύνδεση/Εγγραφή buttons, booking prefill, `Customer.userId` stamping on `POST /api/v1/appointments`. **Code written (uncommitted), pending review.**
- [→] **TASK-035:** Middleware protection for `/account/*`. **Code written (uncommitted). Doc refresh (API.md/ARCHITECTURE.md) NOT done — moved to TASK-041.**

### Chunk #13b — Close all gaps before going live (handoff: `RADEVU-CHUNK13-FIXES-HANDOFF.md`)

Security review (Claude orchestrator, multi-agent) found 2 confirmed HIGH vulns + several unfinished pieces in the uncommitted chunk-#13 work. Nothing ships to the public Pi until TASK-036 + env wiring + docs land (Deploy Gate 1).

- [✓] **TASK-036 (BLOCKER):** Fixed 2 HIGH vulns — deleted unprotected legacy business-registration endpoint, added `currentUser.emailVerified &&` gate in `appointments/route.ts:445`, Turnstile env wiring (env.ts guard + .env.example + compose + Dockerfile build-arg + GHA). Reviewed + approved (Claude).
- [✓] **TASK-037:** Email-verification banner in both layouts + authenticated `POST /api/v1/me/verification/resend` (session-gated, rate-limited `me-verify-resend|<userId>` 3/15min, no Turnstile). Reviewed + approved (Claude).
- [✓] **TASK-038:** Change password — `POST /api/v1/me/change-password` via better-auth `changePassword` (verifies current pw, `revokeOtherSessions`), `change-password|<userId>` 3/10min, mounted in customer + owner settings. Reviewed + approved (Claude).
- [✓] **TASK-039:** Forgot/reset password — `(auth)/forgot-password` + `(auth)/reset-password`, `POST /api/v1/auth/password/{forgot,reset}`, anti-abuse on forgot (no enumeration, always 200), IP rate-limit on reset, `ResetPassword` email, better-auth token 1h single-use. Reviewed + approved (Claude).
- [ ] **TASK-040 (DEFERRED):** Change email with re-verification. Deferred intentionally unless explicitly requested.
- [✓] **TASK-041:** Docs sync — `docs/API.md` (new Auth + Me sections, removed old Businesses registration row, note emailVerified-gated userId linkage on Appointments POST) + `docs/ARCHITECTURE.md` §5 rewrite + new §13. Done.

Non-negotiables for the entire module: guest booking flow at `POST /api/v1/appointments` must remain fully functional without a session — regression test required. Reuse existing helpers (`validateAuthSecurity`, `getCurrentUser`, `checkRateLimit`, `sendVerificationEmail`) — do not duplicate. No new npm packages without approval. No commit/push/Pi-deploy with TASK-036 unresolved.

Chunk #13 is LIVE on the Pi (radevu.olamov.com). Post-deploy fix: GH Actions variable was misnamed (`TURNSTILE` → corrected to `NEXT_PUBLIC_TURNSTILE_SITE_KEY`); rebuilt; Turnstile + registration verified working end-to-end (incl. verification email).

## Module 12: Greek-first UX polish + discovery + content (Chunk #14)

Handoff: `RADEVU-CHUNK14-PLAN-AND-HANDOFF.md` (full specs + Greek translations + 3 business catalogs). Locked: full directory + `category` field · realistic Greek hero sample · branded-icon avatar. Deploy in 3 waves.

- [ ] **TASK-042:** Schema — `Business.category` + `description` (migration, backfill demos) + `BUSINESS_CATEGORIES` constant + `.gitattributes`/`.editorconfig` UTF-8 enforcement.
- [ ] **TASK-043:** Fix all mojibake (Today H1 «Πρόγραμμα» etc.) — grep `Î`/`Ã`/`â€`, re-encode UTF-8.
- [ ] **TASK-044:** Greek-first sweep (UI strings per glossary) + ioannis service names full Greek (seed + live UPDATE).
- [ ] **TASK-045:** Branded default `Avatar` component, applied to empty profiles (business/customer/directory/dashboard).
- [ ] **TASK-046:** Directory page `/epaggelmaties` + `GET /api/v1/businesses/directory` + nav links (header, account, dashboard).
- [ ] **TASK-047:** Customer account «Κλείσε νέο ραντεβού» → directory.
- [ ] **TASK-048:** Landing — Greek hero, realistic Greek sample mockup, «Δωρεάν εγγραφή» CTA, promote directory.
- [ ] **TASK-049:** Owner dashboard cleanup — sections, avatars, Greek labels, empty states.
- [ ] **TASK-050:** Email templates — shared branded `EmailLayout` + Greek copy across all 6.
- [ ] **TASK-051:** 3 new demo businesses (Αντώνης/Ματίνα/Αγγελική) seed + live insert, full Greek catalogs.

Waves: W1 = 042-044 ✓ · W2 = 045-047 + 052 ✓ · W3 = **051** ✓ → 048 ✓ → 049 ✓ → 050 (in progress). Live SQL (service-name UPDATE + 3-business insert) to run on the Pi at the final deploy.

## Module 13: Dual accounts + self-service profile (Chunk #15)

Handoff: `RADEVU-CHUNK15-16-PLAN.md`. Locked: one account two roles (customer + optional business) · `business_type` freelancer/shop (internal) · directory shows only "complete enough" businesses. Starts after Chunk #14 deploys.

- [ ] **TASK-053:** Dual-account model — access by ownership not role (`/account` for all, `/dashboard` if owns a business), `Business.business_type` field, header dual-entry. `userType` becomes soft default-home only.
- [ ] **TASK-054:** «Δημιούργησε επιχείρηση» flow from `/account` (existing user → adds a business). Registration business path stays.
- [ ] **TASK-055:** Profile self-service — add `category` + `description` + `business_type` to profile editor + `updateBusinessProfileSchema` + PATCH route + API.md.
- [ ] **TASK-056:** Onboarding checklist (κατηγορία/ωράριο/υπηρεσία/φωτο+περιγραφή/δημοσίευση) with progress.
- [ ] **TASK-057:** Directory gating — show only businesses with category AND ≥1 active service.

## Module 14: Discovery intelligence (Chunk #16)

Handoff: `RADEVU-CHUNK15-16-PLAN.md`. Locked: per-user + anonymous-aggregate search analytics · recommendation v1 = random (guest) + history (logged-in). Customer rating system = DEFERRED (design-aware only).

- [ ] **TASK-058:** `search_events` table + fire-and-forget logging on directory search (user_id when logged in, else anonymous).
- [ ] **TASK-059:** Founder-only insights page (top searches + counts + top categories, windowed), gated to `FOUNDER_EMAIL`.
- [ ] **TASK-060:** `GET /api/v1/businesses/recommended` (random for guests, history-based for logged-in) + landing «Προτεινόμενα».

## Module 15: Local-test fixes & flows (TASK-061…066)

Handoff: `more/RADEVU-LOCALTEST-FIXES.md`. Found during local testing 2026-06-19. Each on a branch, verify, stop for review. W1 (quick) = 061-064 · W2 (flows) = 065 then 066 (schema review first).

- [ ] **TASK-061:** Header — hide landing anchors (#about/#features/#contact) off the homepage via `usePathname()`; keep «Επαγγελματίες».
- [ ] **TASK-062:** Square logo preview in `ImageUploadField` (kind=logo → aspect-square + object-contain; photo stays rectangular).
- [ ] **TASK-063:** Rename account role label «Πελάτης» → «Χρήστης» (display only; keep internal `customer`; do NOT touch the «Πελάτες» dashboard tab).
- [ ] **TASK-064:** Fix register: Επιχείρηση→Χρήστης then can't create account (Turnstile token reset / stale business fields / schema).
- [ ] **TASK-065:** Change ACCOUNT (login) email with verification (code to old verified email → new email). Warn + logout → `/login` on change. Investigate post-change login failure (contact-vs-login confusion). Fix `VerifyEmailBanner` stale email. Schema review if `pending_email` needed.
- [ ] **TASK-066:** Cancel/reschedule from the confirmation email (tokenized links · cancel reason → notify business · reschedule → business approves → re-notify customer). **SCHEMA REVIEW FIRST** (Appointment fields + tokens).
- [ ] **TASK-067:** Login-attempts audit table — email/time/ip/user-agent/result/reason. **NEVER store passwords.** Fire-and-forget on sign-in. **SCHEMA REVIEW FIRST.**
- [ ] **TASK-068:** Multiple managers per business (add 2nd admin by email) — `business_managers` join table + dashboard access checks. **SCHEMA REVIEW FIRST.**

---

## Cross-cutting reminders for every task

- TypeScript strict. Tailwind only. No inline styles.
- Mobile-first at 360×800. Verify in Playwright before marking done.
- API routes under `/api/v1/...`. Tables `snake_case` plural. Columns `snake_case` singular.
- Ποτέ `$queryRawUnsafe` / `$executeRawUnsafe`, `Prisma.raw`, `Prisma.sql` ή SQL με string concatenation. Μόνο Prisma query builder ή tagged-template `$queryRaw` / `$executeRaw`.
- No new npm packages without approval. No new DB tables without schema review.
- No placeholder / TODO code presented as done.
- Domain + routing mode always env-driven (`BOOKING_BASE_DOMAIN`, `ROUTING_MODE`). Never hardcode `radevu.gr` or `radevu.local`.
