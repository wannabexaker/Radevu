# Codex Handoff #008 — Month calendar booking view + time hardening

> **Codex CLI usage:** `cd C:\Projects\Radevu && codex` then paste this file.
> **Prerequisite:** chunks #1-7 merged. Booking flow currently uses a horizontal 14-day strip. This chunk replaces it with a proper month-grid calendar showing per-day availability density, designed for non-tech users (50+) on mobile.

## Your role

Same as previous chunks. Read `C:\Users\Jiannis\.claude\skills\booking-saas-codex-context\SKILL.md` — follow §6 output format, §4 code style, §5 never-do list, the self-check.

Also load:
- `C:\Users\Jiannis\.claude\skills\booking-saas-project\SKILL.md` (§7 — 60s booking budget, ≤2 taps, mobile-first 360×800)
- `C:\Projects\Radevu\docs\DESIGN.md` (§10 voice/tone — strict Greek anchoring rules)
- `C:\Projects\Radevu\docs\MASTER_VISION.md` (Mobile Philosophy — "Large buttons. Simple screens. No clutter.")
- `C:\Projects\Radevu\docs\API.md`

## Task

Replace the horizontal 14-day date strip in the booking flow with a **month-grid calendar** showing availability density per day. Color-coded dots indicate how busy/free each day is. Tap a day → existing slot picker (no logic change there).

Also: harden the slot generator for DST + boundary edge cases, and enforce booking horizon limits server-side (min 1h notice, max 90 days out).

**Why this matters:** the target users are 50+ professionals + their customers (κουρέας, οδοντίατρος, λογιστής clients). A horizontal 14-day strip looks unfamiliar to them. A month calendar matches the mental model of every paper calendar they've ever used. The density dots replace the cognitive load of "tap each day to find a slot".

## Design intent (read this before coding)

**The calendar IS the differentiator.** This is the surface every customer will see when booking — must feel professional, calm, instantly understandable. NOT a Google Calendar clone — much simpler.

Key principles:
1. **One screen, one task.** Month grid + month navigation arrows + done. No views toggle, no week view, no time-of-day preview embedded in cells.
2. **Density at a glance.** A single colored dot per day tells the whole story: green = plenty of slots, amber = filling up, red = full, grey = closed.
3. **Big touch targets.** Each day cell ≥44×44px. 7-column grid at 360px viewport: each cell ≈48×48px with 4px gap → fits cleanly.
4. **Greek everywhere.** Day labels (Δευ/Τρι/Τετ/Πεμ/Παρ/Σαβ/Κυρ), month names (Ιανουάριος…Δεκέμβριος), formatted dates ("Σάββατο 25 Μαΐου").
5. **Time-aware.** Past dates greyed and disabled. Today highlighted with a ring (not a fill — fills get confused with "selected"). Selected day = solid indigo fill.
6. **No surprise motion.** No animations on day taps, no auto-scrolling on month change. The selection state updates instantly.
7. **Subtle legend.** One line at top: small dots + words "ελεύθερο", "γεμίζει", "γεμάτο", "κλειστά". Never use the word "γνωριμία" or anything dating-adjacent.

## Goal (testable outcome)

After this handoff:

1. On `/test-shop`, tap "Κράτησε ραντεβού" → booking modal opens → pick service.
2. Step 2 is now a **month calendar view** instead of horizontal strip:
   - Current month shown by default. Header: month name + year in Greek (e.g., "Μάιος 2026") + chevron-left / chevron-right arrows.
   - Day-of-week header row: Δευ Τρι Τετ Πεμ Παρ Σαβ Κυρ.
   - 7-column grid of day cells. Each cell shows the day number large + a small colored dot.
   - Past dates: muted grey, not tappable.
   - Today: indigo ring around the cell.
   - Selected day: indigo solid fill, white text.
   - Closed days (business has no working hours that weekday): grey background, "—" dot, not tappable.
   - Future dates with availability: dot color by density (see thresholds below).
   - Legend strip below grid: 4 dots + labels.
3. Tap a day with availability → existing `StepSlotPicker` renders with slots (unchanged logic).
4. Month navigation: tap chevron-right → next month → calendar refreshes data. Can navigate up to 3 months forward (today + 90 days = ~3 months). Past months not navigable.
5. Server-side time hardening:
   - **DST-safe**: slot generation uses `Intl.DateTimeFormat` with `timeZone: business.timezone` for all wall-clock-to-UTC conversions, never naive arithmetic. Greece transitions DST last Sunday of March (forward 1h) and last Sunday of October (back 1h) — slots that cross these boundaries must remain correct.
   - **Min notice**: slot generator filters out slots starting less than 60 minutes from now (was 15min — bump to 60min for owner planning).
   - **Max horizon**: server rejects availability queries for dates >90 days out with `400 BEYOND_HORIZON`.
   - **Past dates**: server rejects availability queries for dates strictly before today with `400 PAST_DATE`.
   - Same protections in the booking POST endpoint (defense in depth).
6. New e2e test `apps/web/tests/e2e/booking-calendar.spec.ts` walks the full flow with calendar interaction. Must still complete in <60s. Verifies: month nav, density dots present, past months not navigable.
7. Existing booking-flow.spec.ts updated for the new step (assertion on calendar visible instead of strip).
8. `pnpm -r typecheck` + Docker build + all existing e2e green.

## Density thresholds (locked)

For a given day, let `n` = number of free slots returned by the availability calculator.

| State | Condition | Dot |
|-------|-----------|-----|
| `closed` | Business has no working hours that weekday | Grey, "—" character or no dot, cell disabled |
| `full` | `n === 0` and business is open | Red dot (`bg-red-500`) |
| `tight` | `1 ≤ n ≤ 3` | Amber dot (`bg-amber-500`) |
| `available` | `4 ≤ n ≤ 10` | Indigo dot (`bg-indigo-500`) |
| `open` | `n > 10` | Green dot (`bg-emerald-500`) |

Use the brand `bg-indigo-500` for the most common state (available) so the calendar feels "on-brand" most of the time. Green only when very open.

## What's already in repo — do NOT modify

- `infra/*`, `.github/workflows/`, all settled infra
- All chunks #1-7 files except those explicitly listed under "Modify" below
- The slot picker step (`StepSlotPicker.tsx`) — its API call signature stays the same
- The booking POST endpoint logic — only add the horizon/notice guards
- Email layer, dashboard tabs, customer/debt pages

## Files you MUST create or modify (closed list)

### Server-side

- **CREATE** `apps/web/src/lib/month-availability.ts` — `getMonthAvailability(business, service, year, month): Promise<MonthAvailability>` where `MonthAvailability = { days: Array<{ date: string, slot_count: number, state: "closed"|"full"|"tight"|"available"|"open" }> }`. Computes for the whole month by loading all appointments in [month_start, month_end+1) in one query, then iterating days. Skips past dates (returns `state: "closed"` for them with `slot_count: 0` to keep array length consistent, but the client uses the local date check too).
- **MODIFY** `apps/web/src/lib/availability.ts` — bump same-day filter from `now + 15min` to `now + 60min`. Document the change with a comment citing chunk #8. Add DST-safety review: the function should already use date-fns OR Intl with timezone — verify and harden if needed. If currently using naive `new Date()` arithmetic across DST boundaries, refactor to use `Intl.DateTimeFormat` with `formatToParts` for wall-clock conversion. Add unit tests in `apps/web/tests/availability.test.ts` (or use Playwright if no Vitest setup) covering: (a) DST spring-forward day (last Sunday of March), (b) DST fall-back day (last Sunday of October), (c) a slot that would start at the non-existent 03:00 wall-clock during spring forward — must be skipped, (d) a slot at 02:30 on fall-back day — must exist exactly once.

### API

- **CREATE** `apps/web/src/app/api/v1/businesses/[id]/availability/month/route.ts` — `GET`. Public. Query: `service_id`, `year`, `month` (1-12). Validates with new zod schema. Returns `{ days: [...] }`. Rejects if month is more than 3 months out (≈ 90 days) with `400 BEYOND_HORIZON`. Rejects past months with `400 PAST_MONTH`.
- **MODIFY** `apps/web/src/app/api/v1/businesses/[id]/availability/route.ts` — add same `BEYOND_HORIZON` + `PAST_DATE` guards on the daily endpoint. Currently it may accept any date silently.
- **MODIFY** `apps/web/src/app/api/v1/appointments/route.ts` (POST handler) — add booking horizon guards: reject `starts_at` outside the 60-min-from-now / 90-days-from-now window with `400 BEYOND_HORIZON` or `400 TOO_SOON`. Defense in depth.

### Shared

- **MODIFY** `packages/shared/src/api/availability.ts` — add `monthAvailabilityQuerySchema` + `MonthAvailabilityDayDTO` + `MonthAvailabilityDTO` types. Add error codes enum `AvailabilityErrorCode = "BEYOND_HORIZON" | "PAST_MONTH" | "PAST_DATE" | "TOO_SOON"`.
- **MODIFY** `packages/shared/src/lib/datetime.ts` — add `formatGreekMonth(date): string` ("Μάιος 2026"), `formatGreekDayShort(date): string` ("Δευ"), `getMonthDays(year, month, timezone): Date[]` (all days of month in tz, returns 28-31 entries), `isPast(date, timezone): boolean`, `isToday(date, timezone): boolean`, `addMonths(date, n): Date`. All JSDoc'd. No new deps (`Intl.DateTimeFormat` everywhere).

### Components (replace + add)

- **REPLACE** `apps/web/src/components/booking/StepDatePicker.tsx` — was the 14-day horizontal strip. Now becomes a server-data-aware client component that:
  - On mount, fetches `/api/v1/businesses/:id/availability/month?service_id=...&year=...&month=...` for current month.
  - Renders `<CalendarMonth>` with the response.
  - Tracks selected day in local state; pushes selection up via `onDateSelect` prop.
  - On chevron-left/right, refetches the new month (loading shimmer while fetching).
- **CREATE** `apps/web/src/components/booking/CalendarMonth.tsx` — pure presentational component. Props: `{ year, month, days: MonthAvailabilityDayDTO[], selectedDate, todayDate, onDayClick, onPrevMonth, onNextMonth, canGoPrev, canGoNext }`. Renders: header (month name + arrows), DOW row, 7-col grid with day cells. Each cell uses Tailwind classes per state. ≥44×44px tap target.
- **CREATE** `apps/web/src/components/booking/CalendarLegend.tsx` — small horizontal strip below grid: 4 mini-dots with Greek labels ("ελεύθερο", "γεμίζει", "γεμάτο", "κλειστά"). Small text (text-xs), muted color.
- **CREATE** `apps/web/src/components/booking/CalendarDay.tsx` — single day cell. Props: `{ day, state, isToday, isSelected, isPast, onClick }`. Internal: handles disabled state + the color dot + the day number.
- **MODIFY** `apps/web/src/components/booking/BookingFlow.tsx` — the date state now holds a `Date` object instead of an index into a strip. Update the state machine accordingly. Step 2 still renders the (now-calendar-based) `StepDatePicker`.
- **MODIFY** `apps/web/src/components/booking/StepSlotPicker.tsx` — no behavior change, but if it currently relies on a date-string format from the strip, ensure it accepts the new Date prop. Document if any adjustment was needed.

### Tests

- **CREATE** `apps/web/tests/e2e/booking-calendar.spec.ts` — Playwright at 360×800:
  - Seed test-shop (from existing seed).
  - Open booking modal, pick service.
  - Assert calendar renders with current month header in Greek.
  - Assert at least one day cell shows a non-grey dot (the seed gives the business open hours mon-sat).
  - Tap the next-month chevron. Assert header updates.
  - Tap chevron-left to return. Assert header.
  - Tap chevron-left again (back to past month). Assert chevron-left is disabled OR no navigation happens.
  - Tap a future day with availability. Assert slot picker renders.
  - Full flow under 60s.
- **MODIFY** `apps/web/tests/e2e/booking-flow.spec.ts` — replace the old strip selector with the calendar day-cell selector. Keep the <60s assertion.

### Docs

- **MODIFY** `docs/API.md` — add the new `GET /api/v1/businesses/:id/availability/month` row + document the new error codes (BEYOND_HORIZON, PAST_MONTH, PAST_DATE, TOO_SOON).
- **MODIFY** `docs/ARCHITECTURE.md` §6 — replace the "date picker" step with "month calendar with density dots". Note the DST-safe slot generation and the 60-min/90-day horizon.
- **MODIFY** `docs/CODEX_TASKS.md` — add a new entry under Module 4: `TASK-023: Month calendar booking view + time hardening. Done by Codex handoff #008.` (Mark done.) TASK-016 (Notifications tab) and TASK-017 (Settings profile editor) remain next.

## Dependencies

**None new.** All date math via `Intl.DateTimeFormat` + small helpers. No date-fns, no calendar libraries, no swipe gestures. Tailwind handles the grid.

## Hard rules

- TypeScript strict. No `any` without justification.
- Tailwind + existing shadcn primitives. No inline styles. No CSS modules.
- Mobile-first 360×800. Each calendar day cell ≥44×44px. Test that the 7-column grid fits at 360px with no horizontal scroll.
- All Greek strings per DESIGN.md §10. The legend labels MUST be the four exact words: "ελεύθερο", "γεμίζει", "γεμάτο", "κλειστά". Avoid "ραντεβού" in the legend (legend describes day state, not a booking action).
- **No swipe gestures.** Use chevron buttons exclusively for month navigation — swipes confuse older users.
- **No animations on day taps.** Selection state changes instantly. Month transitions can have a 150ms fade if you want, but no slide.
- DST + horizon hardening is SERVER-SIDE primary. Client just respects the API errors.
- Snake_case JSON keys.
- Time rendering: `Intl.DateTimeFormat("el-GR", { timeZone: business.timezone })`. Always.
- Server actions + revalidation pattern stays (no changes needed).
- No new npm packages.
- No placeholder/TODO.

## Pre-flight: grep audit

Before declaring done, grep your diff for literal "ραντεβού" and verify every occurrence is anchored per DESIGN.md §10. Report results in the output under "## ραντεβού audit".

Especially watch for new strings in calendar headings + legends — those are easy places to slip into ambiguous phrasing.

## Acceptance criteria — run all

```bash
pnpm install
pnpm -r typecheck
pnpm --filter @radevu/db generate
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d --build web
sleep 30
curl -s http://localhost:3000/api/health
pnpm --filter @radevu/web test:e2e      # existing + new booking-calendar test
```

Manual at 360×800:
- Open `http://localhost:3000/test-shop`
- Tap "Κράτησε ραντεβού"
- Pick a service
- See month calendar. Greek month name. Today has indigo ring. Past dates greyed. Sunday cell for test-shop seed is grey (closed). Some weekdays have indigo dots, some green.
- Tap chevron-right → next month. Header updates. Days reflow.
- Tap chevron-left → back to current month.
- Tap chevron-left from current month → disabled (can't go past).
- Tap a future weekday → slot picker shows. Tap a slot → contact form. Submit → confirmation.
- Total flow under 60s.

API checks:
- `GET /api/v1/businesses/<id>/availability/month?service_id=<svc>&year=2026&month=5` → 200 with days array of length 31
- Same with `year=2026, month=2` (already past) → 400 PAST_MONTH
- Same with `year=2027, month=12` (more than 3 months out) → 400 BEYOND_HORIZON
- `GET /api/v1/businesses/<id>/availability?service_id=<svc>&date=2020-01-01` → 400 PAST_DATE
- `POST /api/v1/appointments` with `starts_at` 30 min from now → 400 TOO_SOON
- `POST /api/v1/appointments` with `starts_at` 100 days from now → 400 BEYOND_HORIZON

DST checks (via unit test or manual):
- Slot generation on 2026-03-29 (last Sunday of March, Greek DST forward) for a business open 02:00–04:00 → NO slot at 03:00 wall-clock (it doesn't exist that day).
- Slot generation on 2026-10-25 (last Sunday of October, Greek DST back) for a business open 02:00–04:00 → ONE slot at 02:30 (the second 02:30 of the day is collapsed — Greek standard is to expose only the first).

## Output format

Per `booking-saas-codex-context` §6:
- `## File: <path>` blocks
- `## Dependencies added` (expected: "None.")
- `## Files that need updating due to this change`
- `## ραντεβού audit` — grep results + per-line comment
- `## DST handling notes` — short paragraph: how is DST handled, where, with which API
- Self-check before returning

Scope: ONLY handoff-008.md. Notifications + Settings profile editor + reminder scheduler stay for chunks #9+. Stop when acceptance passes.
