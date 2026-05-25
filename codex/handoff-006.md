# Codex Handoff #006 — Dashboard Today + Appointments tabs (full)

> **Codex CLI usage:** `cd C:\Projects\Radevu && codex` then paste this file.
> **Prerequisite:** chunks #1-5 merged. Bookings now create appointments and fire emails. This chunk gives the founder a usable dashboard to see and manage those bookings.

## Your role

Same as previous chunks. Read `C:\Users\Jiannis\.claude\skills\booking-saas-codex-context\SKILL.md` — follow §6 output format, §4 code style, §5 never-do list, the self-check.

Also load:
- `C:\Users\Jiannis\.claude\skills\booking-saas-project\SKILL.md` (§5 MVP scope — 6-tab shell with progressive fill; §7 constraints — ≤2 taps, 360×800)
- `C:\Projects\Radevu\docs\DESIGN.md` (§7 primitives, §10 Greek voice/tone — warm, εσύ, no buzzwords)
- `C:\Projects\Radevu\docs\MASTER_VISION.md` (Dashboard Philosophy: "No complexity. Minimal typing. Mostly dropdowns. One tap actions.")
- `C:\Projects\Radevu\docs\API.md`

## Task

Fill the **Today** tab and **Appointments** tab with real, working content. Both tabs are currently placeholders (single `<h1>`). After this chunk the founder uses the dashboard to manage real bookings from real customers.

This corresponds to TASK-012 and TASK-013 in `docs/CODEX_TASKS.md`. The 6-tab shell (TASK-011) is already in place — don't rebuild it. The Customers/Debts/Notifications/Settings tabs stay placeholders for now (chunks #7+).

## Goal (testable outcome)

After this handoff:

1. **Today tab** at `/dashboard/today` (server component):
   - Loads owner's business + today's appointments (in business timezone) ordered by `starts_at` ascending.
   - Each appointment renders as a card: time (large, monospace digits), duration, service name, customer name + phone/email (tappable `tel:`/`mailto:`), paid badge if `paid=true`, status badge.
   - Three one-tap actions per card: **✓ Έγινε** (mark done), **✗ Ακύρωση** (cancel with confirm), **💶 Πληρώθηκε** (toggle paid). Each action calls the API and refreshes via `router.refresh()`.
   - Counter at top: "X ραντεβού σήμερα · Y ολοκληρωμένα · Z ακυρωμένα".
   - Empty state if zero appointments today: "Σήμερα δεν έχεις ραντεβού. Χρόνος για καφέ." with a calm icon.

2. **Appointments tab** at `/dashboard/appointments` (server component, query-param driven):
   - Default view: upcoming appointments from now → next 30 days, grouped by day.
   - Date filter: tappable strip of next 14 days at top + "Όλα" reset button.
   - Search box at top: filters by customer name/email/phone (case-insensitive substring on Postgres `ILIKE`).
   - Each day group shows the day header (Greek "Πέμπτη 28 Μαΐου") + the AppointmentCard list.
   - Past appointments toggle: switch to view past 30 days descending. Button label "Παλιά ραντεβού" / "Επόμενα ραντεβού".
   - Pagination: cursor-based (server-side `take 50` per page, "Φόρτωσε κι άλλα" button at bottom — if there's a clean way using URL params, prefer that over client state).
   - Empty state per filter combination.

3. **Status & paid actions:**
   - PATCH `/api/v1/appointments/:id` with `{ status: "done" | "cancelled" }` or `{ paid: boolean }` or `{ notes: string }`.
   - Owner-only (use `requireOwner` pattern from chunk #2).
   - Cancellation: 200 only, no email sent (Phase 1 — no cancellation emails).
   - Status transitions allowed: scheduled → done · scheduled → cancelled. NOT done → cancelled (immutable past). Reject with 400 INVALID_TRANSITION.

4. **GET endpoints (owner-only):**
   - `GET /api/v1/appointments?from=ISO&to=ISO&status=scheduled,done,cancelled&customer_q=string&cursor=id&take=50` returns `{ appointments[], next_cursor: string | null }`.
   - `GET /api/v1/appointments/:id` returns `{ appointment }` with relations populated (customer + service summary).
   - Always scoped to the owner's business (no cross-business leakage).

5. All UI at 360×800: tap targets ≥44px, sticky bottom nav clears with `pb-20`, no horizontal scroll, ≤2 taps to any action.

6. New e2e test `apps/web/tests/e2e/dashboard-today.spec.ts`:
   - Seed: book a slot via the existing booking flow as a guest.
   - Log in as the seeded owner.
   - Navigate to `/dashboard/today`.
   - See the appointment card.
   - Tap "Έγινε" → card shows "Ολοκληρώθηκε" badge, status now `done`.
   - Tap "💶 Πληρώθηκε" → paid badge appears.
   - Counter updates.
   - Whole interaction completes in <10 seconds.

7. `pnpm -r typecheck` + Docker build + existing booking-flow e2e all still green.

## What's already in repo — do NOT modify

- `infra/*`, `.github/workflows/`, all settled infra
- All chunks #1-5 files except those explicitly listed below
- The 6-tab shell `apps/web/src/app/(protected-dashboard)/dashboard/layout.tsx` — its `BottomNav` is already wired with the 6 destinations
- Customers/Debts/Notifications/Settings placeholder pages (chunks #7+)
- The booking flow client components (chunk #4) and email layer (chunk #5)

## Files you MUST create or modify (closed list)

### Server-side data layer

- `apps/web/src/lib/appointments.ts` — server-only functions:
  - `getTodayAppointments(businessId, timezone): Promise<AppointmentWithRelations[]>` — today in business timezone, ordered by starts_at asc. Include customer + service.
  - `listAppointments(businessId, { from, to, status?, customerQuery?, cursor?, take? }): Promise<{ items, nextCursor }>` — paginated. Default take=50.
  - `getAppointment(businessId, appointmentId): Promise<AppointmentWithRelations | null>` — scoped to business.
  - `updateAppointmentStatus(appointmentId, status): Promise<void>` — enforces transition rules.
  - `updateAppointmentPaid(appointmentId, paid): Promise<void>`.
  - JSDoc on every export with the SQL-equivalent behavior described.

- `apps/web/src/lib/dashboard-server.ts` — `getOwnerBusiness(): Promise<BusinessWithOwner | null>` — reads better-auth session, joins to business via `ownerId`. Used by every dashboard page server component. Centralizes the auth-→-business lookup so individual pages don't duplicate it.

### API routes

- **CREATE** `apps/web/src/app/api/v1/appointments/route.ts` already exists as POST-only (guest booking from chunk #4). **MODIFY** to add a `GET` handler:
  - Owner-only via `requireOwner` (need to look up which business the session owns).
  - Validates query params with new zod schema in `packages/shared/src/api/appointments.ts`.
  - Returns paginated list + nextCursor.
- **CREATE** `apps/web/src/app/api/v1/appointments/[id]/route.ts`:
  - `GET` — owner-only. 404 if not owned by session's business.
  - `PATCH` — owner-only. Validates body with `updateAppointmentSchema` (status?, paid?, notes?). Status transition enforcement. Returns 200 with updated row, 400 on invalid transition.

### Shared schemas (extend existing file)

- **MODIFY** `packages/shared/src/api/appointments.ts` — add:
  - `listAppointmentsQuerySchema` — zod for the GET filters
  - `updateAppointmentSchema` — zod with optional fields (status, paid, notes), refines that at least one is present
  - Status enum already exists in Prisma; mirror it as a zod enum here.

### Dashboard pages (replace placeholders)

- **REPLACE** `apps/web/src/app/(protected-dashboard)/dashboard/today/page.tsx` — server component:
  - `const business = await getOwnerBusiness()` (redirect to register if no business yet, although chunks #1+ should prevent that state)
  - `const items = await getTodayAppointments(business.id, business.timezone)`
  - Render `<TodayHeader counters={...} />` + `<AppointmentList items={items} />`
  - Empty state component if `items.length === 0`

- **REPLACE** `apps/web/src/app/(protected-dashboard)/dashboard/appointments/page.tsx` — server component:
  - Read `searchParams` for `date`, `q`, `view` (upcoming|past), `cursor`
  - Build the appropriate query window
  - Render `<AppointmentsFilters />` (sticky top) + grouped-by-day list + load-more button
  - Each group: `<DayHeader date={...} count={...} />` then `<AppointmentList items={...} />`

### Components

- `apps/web/src/components/dashboard/AppointmentCard.tsx` — single appointment card. Server component receiving the appointment + a server-action callback prop. Visual: large time on left (h-12 text-2xl tabular-nums), right side: service name, customer name, contact icons (tappable). Bottom row: status pill + paid pill + 3 action buttons. Uses lucide icons (Check, X, Euro).

- `apps/web/src/components/dashboard/AppointmentActions.tsx` — client component with the 3 action buttons. Each button calls a server action via `useTransition` for optimistic loading state. Confirm dialog (reuse `ConfirmDialog` from chunk #2) for the cancel action — confirmation message "Σίγουρα να ακυρωθεί αυτό το ραντεβού;" with destructive styling.

- `apps/web/src/components/dashboard/AppointmentList.tsx` — vertical stack with `gap-3`. Empty state if no items: accepts an `emptyMessage` prop.

- `apps/web/src/components/dashboard/TodayHeader.tsx` — counter row at top of Today tab. Shows total + done + cancelled with subtle icon bullets.

- `apps/web/src/components/dashboard/DayHeader.tsx` — Greek day label + appointment count. Sticky position within its day group.

- `apps/web/src/components/dashboard/AppointmentsFilters.tsx` — client component. Date strip (14 days + "Όλα"), search input with 300ms debounce that updates URL via `useRouter().push` (preserves other params), past/upcoming toggle. Uses `usePathname` + `useSearchParams` for URL state.

- `apps/web/src/components/dashboard/StatusPill.tsx` — colored pill (scheduled=indigo-50/700, done=emerald-50/700, cancelled=slate-100/500). Greek label.

- `apps/web/src/components/dashboard/PaidPill.tsx` — green "Πληρώθηκε" pill or grey "Οφείλει €X" pill (computed from amount_due_cents).

### Server actions

- `apps/web/src/app/(protected-dashboard)/dashboard/today/actions.ts` (or similar location — pick one and document):
  - `markAppointmentDone(appointmentId): Promise<void>` — server action, calls `updateAppointmentStatus`, then `revalidatePath("/dashboard/today")` and `/dashboard/appointments`.
  - `cancelAppointment(appointmentId): Promise<void>` — same pattern.
  - `togglePaid(appointmentId): Promise<void>`.
  - All three: load the appointment, verify the session owns the business, then mutate. NEVER trust the appointmentId blindly — always re-check ownership server-side.

### Tests

- `apps/web/tests/e2e/dashboard-today.spec.ts` — Playwright test:
  - Reuses seeded `test-shop` + owner (`barber@radevu.local` / `BarberDev123!` per chunk #4 seed).
  - Seeds an appointment for today directly via DB OR via the booking flow.
  - Logs in, navigates to `/dashboard/today`.
  - Verifies the card renders, tests the 3 actions, asserts UI state changes after each.
  - Asserts total flow < 10s.

### Docs

- **MODIFY** `docs/CODEX_TASKS.md` — mark TASK-012, TASK-013 done. TASK-014 (Customers tab) becomes next.
- **MODIFY** `docs/API.md` — sync the appointments GET/PATCH rows with actual implementation (query params, response shape with `next_cursor`, error codes).

## Dependencies

**None new.** All required primitives (Radix Dialog from chunk #2, lucide icons, Tailwind) are in place. Server actions are native Next.js 15. If you genuinely need a date library beyond `Intl.DateTimeFormat`, stop and ask.

## Hard rules

- TypeScript strict. No `any` without one-line justification.
- Tailwind + existing shadcn primitives in `src/components/ui/`. No inline styles. No CSS modules.
- Mobile-first 360×800. Tap targets ≥44px. Sticky bottom nav not occluded (content has `pb-20`).
- ≤2 taps to any action per DESIGN.md / MASTER_VISION. Tap card → see detail OR tap action button directly. No 3-step menus.
- All copy in Greek. εσύ (informal). Short sentences. No marketing language.
- Snake_case JSON keys in API request/response. camelCase Prisma fields with `@map`.
- Time rendering always via `Intl.DateTimeFormat("el-GR", { timeZone: business.timezone })`. NEVER use client clock.
- API routes scope to owner's business — write a single `requireOwnerForAppointment(appointmentId)` helper that does the join+check, reuse it across PATCH/DELETE/GET-by-id. Returns the appointment with business loaded so the handler doesn't double-fetch.
- Status transition enforcement is server-side, not just UI.
- Server actions revalidate the relevant paths after mutations.
- Empty states have warm Greek copy, not generic "No data".
- No new npm packages.
- No placeholder/TODO. Customers/Debts/Notifications/Settings tabs stay as their existing chunk #1 placeholders (those are intentional, not stubs you need to fill).

## Acceptance criteria — run all

```bash
pnpm install
pnpm -r typecheck
pnpm --filter @radevu/db generate
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d --build web
sleep 30
curl -s http://localhost:3000/api/health
pnpm --filter @radevu/web test:e2e               # booking-flow + dashboard-today both pass
```

Manual at 360×800:
- Book a slot as guest on `/test-shop`
- Log in as `barber@radevu.local`
- `/dashboard/today` → see the booking
- Tap "✓ Έγινε" → status pill changes to "Ολοκληρώθηκε", counter updates
- Tap "💶 Πληρώθηκε" → paid badge appears
- Cancel a different appointment via the X button → confirm dialog → confirm → it disappears from upcoming, appears in past view
- `/dashboard/appointments?view=past` → see the cancelled appointment with cancelled badge
- Search by customer name → only matching appointments
- Date strip → tap a date → only that day's appointments
- All actions complete in ≤2 taps

API contract checks:
- `GET /api/v1/appointments?status=scheduled` as owner → returns owned appointments
- Same call without session → 401
- Same call with different owner's session → 403 (or empty if scoped, document which)
- `PATCH /api/v1/appointments/:id` with `{ status: "done" }` on a `scheduled` appointment → 200
- PATCH with `{ status: "cancelled" }` on a `done` appointment → 400 INVALID_TRANSITION
- PATCH on appointment owned by another business → 403

## Output format

Per `booking-saas-codex-context` §6:
- `## File: <path>` blocks for every file
- Trailing `## Dependencies added` (expected: "None.")
- Trailing `## Files that need updating due to this change`
- Self-check before returning

Scope: ONLY handoff-006.md. Chunk #7 = Customers + Debts tabs. Chunk #8 = reminder scheduler. Stop when acceptance passes.
