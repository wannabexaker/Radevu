# Codex Handoff #010 — Reminder scheduler + Notifications tab

> **Codex CLI usage:** `cd C:\Projects\Radevu && codex` then paste this file.
> **Prerequisite:** chunks #1-9 merged. Booking → confirmation email + owner alert work. Customers get nothing else. This chunk adds the 24-hour-before reminder email + the Notifications tab toggles that control it.

## Your role

Same as previous chunks. Read `C:\Users\Jiannis\.claude\skills\booking-saas-codex-context\SKILL.md` — follow §6 output format, §4 code style, §5 never-do list, the self-check.

Also load:
- `C:\Users\Jiannis\.claude\skills\booking-saas-project\SKILL.md` (§5 MVP scope — Notifications tab minimal: 2 toggles + lead-time picker; SMS/Viber/push = Phase 3)
- `C:\Projects\Radevu\docs\DESIGN.md` (§10 voice/tone strict; email subject + greeting templates mandatory)
- `C:\Projects\Radevu\docs\API.md`
- `C:\Projects\Radevu\docs\ARCHITECTURE.md` (§7 email pipeline — BookingReminder is the last template; "Reminder scheduling: Redis-backed delayed queue, worker process every minute")

## Task

Build the **reminder scheduler** (Redis-backed delayed queue + worker) and the **Notifications tab** that controls it. This closes Module 6 in `docs/CODEX_TASKS.md` and is the last feature chunk for Phase 1 MVP.

Corresponds to TASK-016 (Notifications tab) + TASK-020 (Reminder scheduler).

## Goal (testable outcome)

After this handoff:

1. **Schema migration** adds `notification_settings` JSONB on Business with default `{ confirmation_enabled: true, reminder_enabled: true, reminder_lead_minutes: 1440 }`. Existing businesses backfilled with the default in the migration.

2. **Notifications tab** at `/dashboard/notifications` replaces the placeholder:
   - Toggle "Email επιβεβαίωσης μετά την κράτηση" — bound to `confirmation_enabled`. When OFF: chunk #5's BookingConfirmation does NOT send (owner alert still does). Helper text: "Στέλνεται στον πελάτη αμέσως μετά την κράτηση, μαζί με αρχείο ημερολογίου."
   - Toggle "Υπενθύμιση πριν το ραντεβού" — bound to `reminder_enabled`.
   - Lead-time picker (visible only when reminder toggle ON): radio cards with three options — "12 ώρες πριν" (720), "24 ώρες πριν" (1440), "48 ώρες πριν" (2880). Default 24h.
   - Helper text under the lead picker: "Η υπενθύμιση φεύγει αυτόματα πριν την ώρα της κράτησης. Αν ο πελάτης δεν έχει email, δεν στέλνεται τίποτα."
   - "Αποθήκευση" button at bottom. Save server action persists to `notification_settings`. Toast "Αποθηκεύτηκε" 2 seconds.

3. **Reminder queue** (custom Redis ZSET — NO new dependencies like BullMQ):
   - `apps/web/src/lib/reminder-queue.ts` exports:
     - `enqueueReminder({ appointmentId, fireAt }): Promise<void>` — uses `ZADD radevu:reminders <unix_ms> <appointmentId>` (NX so re-enqueue doesn't duplicate; if already there, update score via `XX` GT to take the later time).
     - `cancelReminder(appointmentId): Promise<void>` — `ZREM radevu:reminders <appointmentId>`.
     - `fetchDue(now, limit): Promise<string[]>` — `ZRANGEBYSCORE 0 now LIMIT 0 limit` + immediate `ZREM` for each in a transaction (or use a Lua script for atomic claim). Returns the claimed appointment IDs.
   - JSDoc on every export.

4. **Worker** in same Next.js process via `instrumentation.ts`:
   - `apps/web/instrumentation.ts` — Next.js 15 startup hook. On `nodejs` runtime only (skip edge), starts the worker.
   - `apps/web/src/lib/reminder-worker.ts` — `startReminderWorker()`. Loops with `setInterval(60_000)`. Each tick:
     1. `fetchDue(now, 50)` — atomic claim.
     2. For each appointment ID: load appointment + customer + service + business + owner; if appointment status !== scheduled → skip; if customer has no email → skip + log; otherwise call `sendBookingReminder(...)`.
     3. Failure handling: catch per-job, log with appointment_id, do NOT re-enqueue (Phase 1 best-effort — owner will see the booking in their dashboard anyway).
   - Guard against multiple workers in dev (HMR): check `globalThis.__radevu_reminder_worker_started__` and skip duplicate starts.

5. **Hook scheduler into appointment lifecycle**:
   - In `POST /api/v1/appointments` route handler (chunk #4), after the appointment + emails fire-and-forget: if `business.notification_settings.reminder_enabled` AND `customer.email`, compute `fireAt = appointment.starts_at - reminder_lead_minutes * 60_000`. If `fireAt > now + 60_000` (worth scheduling), call `enqueueReminder({ appointmentId, fireAt })`.
   - In `PATCH /api/v1/appointments/[id]` (chunk #6) status update: if new status is `cancelled` or `done`, call `cancelReminder(appointmentId)`.
   - In booking confirmation send (chunk #5): respect `notification_settings.confirmation_enabled`. If OFF, skip the customer email (owner alert still fires).

6. **BookingReminder email**:
   - `packages/email/src/templates/BookingReminder.tsx` — React Email template, Greek per DESIGN.md §10. Subject (mandatory pattern): `Υπενθύμιση: αύριο {formatted_time} — {service_name} στις {business_name}`. Body: shows customer name, service, formatted date+time in business timezone, business contact info, Maps link if any. Mobile-friendly (single column, ≥16px text, max-width 480px). Closing per DESIGN.md.
   - `packages/email/src/sendBookingReminder.ts` — exports `sendBookingReminder({ to, business, customer, service, appointment, timezone }): Promise<{ id: string }>`. Throws on Resend failure.
   - **MODIFY** `packages/email/src/index.ts` — re-export.

7. **API**:
   - `PATCH /api/v1/businesses/:id/notifications` — owner-only. Body validated by new shared schema. Persists `notification_settings`. Returns `200 { business: { id, notification_settings } }`.

8. **Shared schema**:
   - `packages/shared/src/api/notification-settings.ts` — zod schemas:
     - `notificationSettingsSchema` = `{ confirmation_enabled: boolean, reminder_enabled: boolean, reminder_lead_minutes: enum([720, 1440, 2880]) }`.
     - `updateNotificationSettingsSchema` — partial, refines at least one field present.
     - DTO type.
   - `packages/shared/src/index.ts` — re-export.

9. **E2e**:
   - `apps/web/tests/e2e/notifications-settings.spec.ts` — log in, navigate Settings → Ειδοποιήσεις, toggle reminder OFF, save, reload, verify state persisted. Then toggle ON, pick 48h lead, save, reload, verify. Under 20s.
   - No e2e for the actual reminder firing (would need time travel). Cover the queue logic via a **node `--test` unit test** in `packages/db/` or a co-located test in `apps/web/tests/unit/reminder-queue.test.ts`. Use a real Redis instance from the dev docker-compose if available (the existing test harness uses it). Cover: enqueue + cancel + fetchDue ordering + double-enqueue safety.

10. `pnpm -r typecheck` + Docker build + all 9 existing e2e + new notifications e2e pass.

## Design intent

- **Owner control matters.** Some owners (e.g., dentist) want zero customer emails — they prefer to call. Toggles let them opt out without losing the dashboard view.
- **Customer experience stays calm.** Max one email at booking, max one reminder. No "are you still coming?" follow-ups.
- **Worker is humble.** Best-effort. If Resend fails, log and move on — the customer can still see the booking on their calendar (.ics attached at confirmation). Reminder is a nice-to-have, not a guarantee.
- **No new deps.** Redis ZSET pattern + native `setInterval` are enough for Phase 1. BullMQ is great but overkill until scale. Document the limitation: single-process worker = if Pi reboots during the minute the reminder was due, that reminder is lost. Acceptable for Phase 1.

## What's already in repo — do NOT modify

- `infra/*`, `.github/workflows/`, Dockerfile, all settled infra
- All chunks #1-9 files except those explicitly listed under "Modify" below
- The booking flow + calendar + dashboard + settings/profile/hours/services/visibility — none touched here except the appointment route handlers that get the enqueue/cancel hooks

## Files you MUST create or modify (closed list)

### Database

- **MODIFY** `packages/db/prisma/schema.prisma` — add `notificationSettings Json @default("{\"confirmation_enabled\":true,\"reminder_enabled\":true,\"reminder_lead_minutes\":1440}") @map("notification_settings")` to Business.
- **CREATE** new migration `packages/db/prisma/migrations/<timestamp>_business_notification_settings/migration.sql` — ALTER TABLE + backfill statement.

### Shared

- **CREATE** `packages/shared/src/api/notification-settings.ts` — schemas + DTOs.
- **MODIFY** `packages/shared/src/index.ts` — re-export.

### Email

- **CREATE** `packages/email/src/templates/BookingReminder.tsx` — Greek email template.
- **CREATE** `packages/email/src/sendBookingReminder.ts` — Resend sender wrapper.
- **MODIFY** `packages/email/src/index.ts` — re-export.

### Server-side lib

- **CREATE** `apps/web/src/lib/reminder-queue.ts` — Redis ZSET helpers. Atomic claim via Lua script `EVAL`.
- **CREATE** `apps/web/src/lib/reminder-worker.ts` — worker loop. JSDoc the lifecycle + error handling.
- **CREATE** `apps/web/instrumentation.ts` — Next.js startup hook, starts the worker on nodejs runtime.
- **MODIFY** `apps/web/next.config.mjs` — enable `experimental.instrumentationHook = true` IF needed for the version (Next.js 15.0.x — verify in their docs; recent versions have it on by default).

### API

- **CREATE** `apps/web/src/app/api/v1/businesses/[id]/notifications/route.ts` — PATCH owner-only.
- **MODIFY** `apps/web/src/app/api/v1/appointments/route.ts` (POST) — enqueue reminder after appointment created, gated on `confirmation_enabled` and `reminder_enabled`.
- **MODIFY** `apps/web/src/app/api/v1/appointments/[id]/route.ts` (PATCH) — cancel reminder on status change to `cancelled` or `done`.
- **MODIFY** `packages/email/src/sendBookingConfirmation.ts` — accept a `confirmation_enabled` flag from caller (or just check at the call site in route handler). Cleaner: keep the sender unchanged, do the gate in `apps/web/src/app/api/v1/appointments/route.ts`. Document the choice.

### Dashboard

- **REPLACE** `apps/web/src/app/(protected-dashboard)/dashboard/notifications/page.tsx` — server component loading the business, rendering `<NotificationsEditor initialSettings={...} />`.
- **CREATE** `apps/web/src/app/(protected-dashboard)/dashboard/notifications/NotificationsEditor.tsx` — client component with the 2 toggles + lead picker + save button.
- **CREATE** `apps/web/src/app/(protected-dashboard)/dashboard/notifications/actions.ts` — server action `saveNotificationSettings(formData)`.
- **CREATE** `apps/web/src/components/settings/LeadTimePicker.tsx` — radio cards for 12h/24h/48h with Greek labels.

### Tests

- **CREATE** `apps/web/tests/unit/reminder-queue.test.ts` — node `--test` (per the existing `packages/email` pattern from chunk #5). Covers enqueue, cancel, fetchDue ordering, double-enqueue safety. Use the dev Redis. Skip if `REDIS_URL` not set (CI safety).
- **CREATE** `apps/web/tests/e2e/notifications-settings.spec.ts` — Playwright at 360×800.
- **MODIFY** `apps/web/package.json` — add `"test": "node --experimental-strip-types --test tests/unit/*.test.ts"` script if not present. **No new npm deps.**

### Docs

- **MODIFY** `docs/API.md` — add `PATCH /api/v1/businesses/:id/notifications` row + the schema example.
- **MODIFY** `docs/ARCHITECTURE.md` §7 — replace the "chunk #6" marker on BookingReminder with "done in chunk #10". Add a paragraph on the reminder queue: Redis ZSET, worker tick 60s, single-process best-effort, no retry on Resend failure.
- **MODIFY** `docs/CODEX_TASKS.md` — mark TASK-016, TASK-020 done. Phase 1 MVP feature work is now COMPLETE. TASK-021 (routing modes middleware verification) + TASK-022 (Cloudflare Tunnel, blocked on domain) + TASK-001 (Pi deploy) remain as non-coding ops.
- **MODIFY** `infra/SETUP.md` — add a small note in step 3 ("Data dirs") about chown'ing `/srv/radevu/uploads` to uid 1001 (the container's `nodejs` user) so uploads from chunk #9 work without `docker exec --user root chown` workarounds. Codex's chunk #9 acceptance flagged this.

## Dependencies

**None new.** Redis ZSET + native `setInterval` + ioredis (already there) + Resend (already there). If you genuinely need one, stop and ask.

## Hard rules

- TypeScript strict. No `any` without justification.
- Tailwind + existing shadcn primitives. No inline styles. No CSS modules.
- Mobile-first 360×800. Tap targets ≥44px.
- All Greek strings per DESIGN.md §10. Reminder email subject MUST match the mandatory pattern: `Υπενθύμιση: αύριο {formatted_time} — {service_name} στις {business_name}`. Don't paraphrase.
- Snake_case JSON keys. camelCase Prisma fields with `@map`.
- Time: render in business timezone via `Intl.DateTimeFormat("el-GR", { timeZone: business.timezone })`. The reminder template formats "αύριο" only when the appointment is in the calendar-day after today in business TZ — otherwise use full date.
- Atomic queue ops: claim + ZREM via Lua script in `fetchDue`. Concurrent worker invocations (HMR, multiple instances if ever) must not double-fire.
- Worker startup guarded against duplicate via `globalThis.__radevu_reminder_worker_started__`.
- Server actions revalidate `/dashboard/notifications`.
- No new npm packages.
- No placeholder/TODO. Phase 1 feature work is finished after this.

## Pre-flight: grep audit

Before declaring done, grep your diff for literal "ραντεβού" and verify every occurrence is anchored per DESIGN.md §10. Report under "## ραντεβού audit". The reminder template, the editor helper text, and the lead picker labels are most exposed.

## Acceptance criteria — run all

```bash
pnpm install
pnpm -r typecheck
pnpm --filter @radevu/db generate
pnpm --filter @radevu/db migrate:dev --name business_notification_settings
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d --build web
sleep 30
curl -s http://localhost:3000/api/health     # still ok
pnpm --filter @radevu/web test               # reminder-queue unit test passes
pnpm --filter @radevu/web test:e2e           # 9 existing + new notifications = 10 tests
```

Worker smoke test:
- Tail container logs: `docker logs -f radevu-web | grep reminder` — see startup line `[reminder-worker] started, tick=60s`.
- Verify no duplicate startups in HMR dev mode (run `pnpm --filter @radevu/web dev` outside Docker; reload a file; check only one start log).

Manual at 360×800:
- Log in. Settings → Ειδοποιήσεις. See both toggles ON, lead at 24 ώρες πριν.
- Toggle confirmation OFF, save, reload — persists.
- Book a slot as guest using `dimos.is.dev@gmail.com` → no customer email this time (toggle off), owner alert still fires.
- Toggle confirmation ON, toggle reminder OFF, save. Book again. Confirmation arrives. No reminder ever scheduled (verify via `redis-cli ZSCORE radevu:reminders <appt_id>` → nil).
- Both ON, lead 48h. Create an appointment exactly 50h from now (use API directly via curl). Verify `ZSCORE radevu:reminders <appt_id>` ≈ `now + 2h * 3600 * 1000`.
- Manually fast-forward by zadding `0` as score for that appointment ID, wait one minute, watch logs — reminder fires, customer email arrives.

API contract checks:
- `PATCH /api/v1/businesses/<id>/notifications` with `{ reminder_lead_minutes: 9999 }` → 400 VALIDATION_ERROR.
- `PATCH /api/v1/businesses/<other-id>/notifications` → 403.
- `PATCH /api/v1/appointments/<id>` with `{ status: "cancelled" }` → on success, ZSCORE returns nil for that appointment.

## Output format

Per `booking-saas-codex-context` §6:
- `## File: <path>` blocks
- `## Dependencies added` (expected: "None.")
- `## Files that need updating due to this change`
- `## ραντεβού audit` — grep results + per-line comment
- `## Reminder queue notes` — short paragraph: ZSET key name, claim mechanism, single-process limitations, what happens on Pi reboot
- Self-check before returning

Scope: ONLY handoff-010.md. Phase 1 MVP feature work is COMPLETE after this. Remaining work is non-coding ops (Pi deploy, domain purchase, Cloudflare Tunnel). Stop when acceptance passes.
