# Codex Handoff #004 — Public business profile (real) + booking flow + availability

> **Codex CLI usage:** `cd C:\Projects\Radevu && codex` then paste this file.
> **Prerequisite:** chunks #1, #2, #3 merged. Docker compose env passthrough for `CONTACT_NOTIFICATION_EMAIL` is in place.

## Your role

Same as previous chunks. Read `C:\Users\Jiannis\.claude\skills\booking-saas-codex-context\SKILL.md` as your system prompt — follow §6 output format, §4 code style, §5 never-do list, the self-check.

Also load:
- `C:\Users\Jiannis\.claude\skills\booking-saas-project\SKILL.md` (especially §5 MVP scope, §7 architecture constraints — 60-second booking budget, 360×800 mobile-first)
- `C:\Projects\Radevu\docs\DESIGN.md` (especially §1 colors, §3 typography, §7 primitives, §10 voice/tone Greek)
- `C:\Projects\Radevu\docs\MASTER_VISION.md` (Customer Flow section)
- `C:\Projects\Radevu\docs\ARCHITECTURE.md` (§6 booking flow steps, §8 schema)
- `C:\Projects\Radevu\docs\API.md` (availability + appointments contracts — already documented)

## Task

Replace the placeholder `/[business]/page.tsx` with the real public profile + complete booking flow up to confirmation screen. **No email sending in this chunk** — appointment is saved to DB, confirmation screen renders client-side. Email layer is chunk #5.

## Goal (testable outcome)

After this handoff:

1. From chunk #1's `test-shop` business (or any business with services from chunk #2), browse to `http://localhost:3000/test-shop` → SSR public profile renders with logo, photo, business name, working hours summary, services list (name + duration + price), social links (if set), Maps link (if set), sticky bottom "Κράτησε ραντεβού" CTA.
2. Tap CTA → booking flow opens in a full-screen overlay (modal) on mobile, side panel on desktop. Step 1: service picker (radio cards).
3. Tap a service → Step 2: date picker (horizontal scrollable strip of next 14 days, today highlighted, sundays subtly muted). Past-only-today disabled (e.g., 8pm and the only slots are 9-5).
4. Tap a date → Step 3: slot picker. Server-side availability call (`GET /api/v1/businesses/:id/availability?service_id&date`) returns free slots in business timezone. Render as grid of buttons (e.g., "10:00", "10:30", "11:00"). Slots are 15-minute granularity, must fit service duration without overlapping existing scheduled appointments.
5. Tap a slot → Step 4: contact form (name required, at least one of email/phone required, optional note field). Validates client-side, then submits.
6. Submit → `POST /api/v1/appointments` → creates Customer (auto-upsert by business_id + email or phone) and Appointment (status=scheduled, paid=false). Server returns 201 with appointment details.
7. Step 5: confirmation screen — green checkmark icon, "Έγινε κράτηση!", business name + service + date/time formatted in Greek, customer name, "Θα λάβεις επιβεβαίωση στο email σου σύντομα" placeholder text (we'll wire email in chunk #5), "Κλείσε" button → returns to profile.
8. Whole flow at 360×800 completes in **under 60 seconds** for an experienced user (verify via Playwright e2e test).
9. Reserved slugs (`admin`, `www`, etc.) and unknown slugs → 404.
10. `pnpm -r typecheck` passes. Docker compose build green.

## What's already in repo — do NOT modify

- `infra/*` (compose files, Dockerfile, SETUP, .env.example — all settled)
- `.github/workflows/build-and-push.yml`
- All chunk #1-3 files except where explicitly listed below
- Skill files, MASTER_VISION, DESIGN.md (these are reference)

## Files you MUST create or modify (closed list)

### Shared schemas + helpers

- `packages/shared/src/api/availability.ts` — zod schema for availability query (`service_id: cuid, date: ISO YYYY-MM-DD`). Response type `{ slots: Array<{ starts_at: ISO string, ends_at: ISO string }> }`.
- `packages/shared/src/api/appointments.ts` — zod schema for guest booking POST: `{ business_id, service_id, starts_at, customer: { name (2-100), email? (valid), phone? (5-20) }, note? (max 500) }`. Refine: at least one of email/phone required. Response: `{ appointment: AppointmentDTO }`.
- `packages/shared/src/lib/working-hours.ts` — types + parser for working_hours JSON. Schema: `{ mon: [{open:"09:00", close:"17:00"}, ...], tue: [...], ...}`. Each day = array of intervals (supports lunch breaks). Helper: `getDayIntervals(workingHours, dayOfWeek): Interval[]`.
- `packages/shared/src/lib/datetime.ts` — pure helpers: `formatGreekDate(date): string` (e.g., "Δευτέρα 25 Μαΐου"), `formatGreekTime(date): string` ("14:30"), `formatGreekDateTime(date): string`, `addMinutes(date, n): Date`, `next14Days(timezone): Date[]`. Use native `Intl.DateTimeFormat("el-GR", ...)`. NO new deps.
- **MODIFY** `packages/shared/src/index.ts` — re-export new modules.

### Server-side availability calculator

- `apps/web/src/lib/availability.ts` — pure function `generateSlots(business, service, dateISO, existingAppointments): Slot[]`:
  - Read working hours for that weekday
  - Generate 15-minute candidates from open to close
  - Filter: must fit service duration without overlapping existing scheduled appointments
  - Filter: if date is today, must be in the future (>= now + 15min buffer)
  - Return slots in business timezone
  - JSDoc with complexity note (O(slots × existing) — acceptable for Phase 1 daily granularity)

### API routes

- `apps/web/src/app/api/v1/businesses/[id]/availability/route.ts` — `GET`. Public. Validates query, loads business + active services + day's appointments (status=scheduled), calls `generateSlots`, returns `{ slots }`. 404 if business not found, 400 if service not in business or not active.
- `apps/web/src/app/api/v1/appointments/route.ts` — `POST` only (guest). Validates body. Within Prisma transaction:
  1. Load business + service (must be active, must belong to business)
  2. Compute `ends_at = starts_at + service.duration_minutes`
  3. Re-validate slot is still free (race condition guard) — if not, return `409 { error: { code: "SLOT_TAKEN" } }`
  4. Upsert Customer: lookup by `(business_id, email)` OR `(business_id, phone)`. If exists, update name if empty. Else create.
  5. Create Appointment (scheduled, paid=false, amount_due_cents=service.price_cents, notes=body.note)
  6. Return `201 { appointment: { id, business_id, customer_id, service_id, starts_at, ends_at, status, paid, amount_due_cents, currency, customer_name, service_name } }`
  - Snake_case JSON keys throughout.

### Public profile page (REPLACE placeholder)

- **REPLACE** `apps/web/src/app/[business]/page.tsx` — server component. `generateMetadata` from business name. Resolve slug → business via Prisma (404 if not found or slug is reserved). Render:
  - `<BusinessProfile business={...} />` (server component composing the sections below)
  - `<BookingTrigger businessId={...} services={activeServices} workingHours={...} timezone={...} />` (client component for the modal)
- **MODIFY** `apps/web/src/app/[business]/layout.tsx` — minimal layout: white background, max-w-md mx-auto (phone-shaped container even on desktop per DESIGN.md §4), no dashboard chrome.

### Profile components (server-side render, no JS shipped unless needed)

- `apps/web/src/components/profile/BusinessProfile.tsx` — composes everything in a vertical stack: `<ProfileHero>` (logo + photo + name), `<WorkingHoursSummary>`, `<ServicesList>`, `<ContactInfo>`, `<SocialLinks>`, `<MapsLink>`. Mobile-app feel, generous spacing.
- `apps/web/src/components/profile/ProfileHero.tsx` — Logo (use existing Logo component from chunk #3) above + photo as soft-rounded card below + business name as h1. If photo missing, gradient placeholder.
- `apps/web/src/components/profile/WorkingHoursSummary.tsx` — Greek day labels (Δευτέρα-Κυριακή), each line shows open intervals (e.g., "09:00 - 14:00, 17:00 - 21:00") or "Κλειστά".
- `apps/web/src/components/profile/ServicesList.tsx` — card per service with name, formatted duration ("30 λεπτά"), formatted price ("€15,00"). Optional description below.
- `apps/web/src/components/profile/ContactInfo.tsx` — phone + email icons + tappable links.
- `apps/web/src/components/profile/SocialLinks.tsx` — IG + FB icons if `social_links` has them. Round buttons.
- `apps/web/src/components/profile/MapsLink.tsx` — if `maps_url` set: outlined button "Δες στον χάρτη" with MapPin icon.

### Booking flow (client components)

- `apps/web/src/components/booking/BookingTrigger.tsx` — sticky bottom button "Κράτησε ραντεβού" (full width, indigo-500, h-14, shadow-md, z-30). On tap opens the modal. Visible only on profile page.
- `apps/web/src/components/booking/BookingModal.tsx` — Radix Dialog full-screen on mobile, centered on desktop. Header: business name + close X. Body: hosts the multi-step flow. Footer: contextual.
- `apps/web/src/components/booking/BookingFlow.tsx` — state machine for the 5 steps: `service` → `date` → `slot` → `contact` → `confirmation`. Uses React useReducer. Each step renders its own component. Back button on every step (except confirmation), step indicator dots at top.
- `apps/web/src/components/booking/StepServicePicker.tsx` — radio cards (one column on mobile). Each card: name, duration, price. Tap → advances.
- `apps/web/src/components/booking/StepDatePicker.tsx` — horizontal scrollable strip of next 14 days. Each day = button with day name (Δευ/Τρι/...) + day number + month name (only on first of month). Tap → advances. Disabled if business has no working hours that day.
- `apps/web/src/components/booking/StepSlotPicker.tsx` — fetches `/api/v1/businesses/:id/availability?...` on mount with chosen service + date. Shows loading state, then grid of slot buttons (grid-cols-3 on mobile). Empty state: "Δεν υπάρχουν διαθέσιμα ραντεβού αυτή τη μέρα. Δοκίμασε άλλη μέρα." with a "Πίσω" button.
- `apps/web/src/components/booking/StepContactForm.tsx` — name (required), email (optional but at least one), phone (optional but at least one), optional note (textarea). Validates client-side. Submit button at bottom.
- `apps/web/src/components/booking/StepConfirmation.tsx` — green check icon, "Έγινε κράτηση!", details list (service, date+time, business), name. Note: "Θα λάβεις επιβεβαίωση στο email σύντομα." (Email comes in chunk #5.) Close button.

### Tests

- `apps/web/tests/e2e/booking-flow.spec.ts` — Playwright test at 360×800 viewport. Starts from a seeded business `/test-shop`. Walks through the 5 steps with realistic timings. **Asserts the full flow completes in under 60 seconds.** If it exceeds, fail with clear message about which step took longest.

### Docs

- **MODIFY** `docs/CODEX_TASKS.md` — mark TASK-008, TASK-009, TASK-010 done. Update TASK-011 (next).
- **MODIFY** `docs/API.md` — update availability and appointments rows if response shape differs from current spec (sync with the actual implementation).

### Seed script (small but critical for testing)

- `packages/db/prisma/seed.ts` — if missing, create. Idempotent seed: creates a barber business `test-shop` if not exists, owner user `barber@radevu.local` with password `BarberDev123!`, 3 services (Ανδρικό κούρεμα 30min €15, Γενειάδα 20min €8, Κούρεμα + Γενειάδα 45min €20), working hours mon-fri 09:00-19:00 sat 09:00-15:00 sunday closed, `show_on_landing=true`. Hook in `packages/db/package.json` as `"seed": "prisma db seed"` and Prisma `seed` config in `packages/db/package.json` per Prisma 5 docs.

## Dependencies you may add

**None.** Stay within current deps. If you genuinely need one, stop and ask. The date strip is custom (no react-day-picker). Date formatting uses native `Intl.DateTimeFormat("el-GR")`.

## Hard rules

- TypeScript strict, no `any` without one-line justification.
- Tailwind + existing shadcn primitives in `src/components/ui/`. No inline styles. No CSS modules.
- Mobile-first 360×800. Tap targets ≥44px. Booking modal full-screen on mobile.
- All timestamps stored in UTC, rendered in business timezone with `Intl.DateTimeFormat("el-GR", { timeZone: business.timezone })`. **Never trust the client clock for slot availability** — server is source of truth.
- All Greek strings in copy (UI text). No English UI text in user-facing surfaces.
- Snake_case JSON keys. camelCase Prisma fields with `@map` (already established).
- API routes: `/api/v1/...`. Standard error envelope `{ error: { code, message, details? } }`.
- JSDoc on every exported function from `lib/` and `packages/`. Especially `generateSlots()` — the algorithm needs to be readable.
- Explicit error handling. No silent catches. Server logs context; client gets generic Greek message.
- Use the existing `requireOwner()` helper pattern from chunk #2 — but note that this chunk's main routes are PUBLIC (availability + booking), so they don't call requireOwner. They DO validate that the business exists and the service belongs to it and is active.
- Never hardcode `radevu.gr`/`radevu.local`/TLD — read from env.
- No new npm packages.
- No placeholder/TODO. The "Θα λάβεις επιβεβαίωση στο email σύντομα" copy IS the intentional Phase 1 deliverable for this chunk; chunk #5 will add the actual email.

## Acceptance criteria — run all

```bash
pnpm install
pnpm -r typecheck                              # zero errors
pnpm --filter @radevu/db generate
pnpm --filter @radevu/db migrate:dev           # no new migration expected, just safety
pnpm --filter @radevu/db exec prisma db seed   # seeds test-shop
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d --build web
sleep 30
curl -s http://localhost:3000/api/health       # still {"status":"ok","db":"ok","redis":"ok"}
curl -s "http://localhost:3000/api/v1/businesses/<test-shop-id>/availability?service_id=<svc>&date=2026-05-25" | head -c 400
```

Browser at 360×800:
- `/test-shop` → real profile renders (logo, photo placeholder OK, services, hours, contact)
- Tap "Κράτησε ραντεβού" → modal opens with service picker
- Tap a service → date strip
- Tap a date → slots load
- Tap a slot → contact form
- Fill name + email, submit → confirmation screen
- Open Prisma Studio or `psql` → verify Appointment row + Customer row created with correct relations
- Refresh availability for same date+service → the booked slot is no longer offered

```bash
pnpm --filter @radevu/web test:e2e             # booking-flow.spec.ts passes, <60s assertion green
```

Edge cases to verify:
- `/admin` still 404 (reserved slug)
- `/nonexistent-slug` 404
- Submitting same slot twice in parallel: second attempt gets 409 SLOT_TAKEN
- Service with 0 active state → 400 on availability/booking
- Date with no working hours → availability returns `{ slots: [] }` cleanly, slot picker shows empty state

## Output format

Per `booking-saas-codex-context` §6:
- `## File: <path>` per created/modified file with complete content
- Trailing `## Dependencies added` (should be "None.")
- Trailing `## Files that need updating due to this change`
- Self-check before returning per skill instructions

Scope: ONLY handoff-004.md. Email layer = chunk #5. Dashboard real content (Today/Appointments tabs filling) = chunk #6. Stop when acceptance passes.
