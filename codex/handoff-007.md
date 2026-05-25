# Codex Handoff #007 — Customers + Debts tabs (minimal CRM)

> **Codex CLI usage:** `cd C:\Projects\Radevu && codex` then paste this file.
> **Prerequisite:** chunks #1-6 merged. Booking flow live, emails fire, Today + Appointments tabs functional. This chunk fills the remaining two operational tabs with minimal but useful content.

## Your role

Same as previous chunks. Read `C:\Users\Jiannis\.claude\skills\booking-saas-codex-context\SKILL.md` — follow §6 output format, §4 code style, §5 never-do list, the self-check.

Also load:
- `C:\Users\Jiannis\.claude\skills\booking-saas-project\SKILL.md` (§5 MVP: Customers minimal, Debts minimal — full CRM/reminders = Phase 2)
- `C:\Projects\Radevu\docs\DESIGN.md` (**§10 voice/tone — strict: every "ραντεβού" must be anchored, prefer "κράτηση"**)
- `C:\Projects\Radevu\docs\VERTICALS.md` (locked profession list — note "Καφετέρια HR" needs "συνέντευξη" wording, not "ραντεβού")
- `C:\Projects\Radevu\docs\API.md` (Customers routes already documented — sync your implementation)

## Task

Fill the **Customers** tab and the **Debts** tab with real, working content. Both are currently single-`<h1>` placeholders.

Per MVP scope (§5), this is **minimal CRM** — list + detail + one-tap actions, no notes-template engine yet, no reminder scheduler yet. The customer model has all the fields from day 1 — we just surface the subset that's useful in Phase 1.

This corresponds to TASK-014 + TASK-015 in `docs/CODEX_TASKS.md`. Notifications and Settings tabs stay as placeholders (Settings has the services + visibility sub-routes from earlier chunks; that's enough).

## Goal (testable outcome)

After this handoff:

1. **Customers tab** at `/dashboard/customers` (server component):
   - Lists all customers of the owner's business, ordered by most-recent-appointment desc.
   - Each row shows: avatar circle (first letter of name), customer name, phone/email summary, last-appointment date in Greek (`"Τελευταία κράτηση: Τρι 14 Μαΐου"`), total bookings count (`"5 κρατήσεις συνολικά"`).
   - Search box at top: case-insensitive filter on name, email, phone (Postgres `ILIKE`).
   - Empty state if no customers yet: `"Δεν έχεις πελάτες ακόμα. Θα εμφανίζονται εδώ μόλις γίνει η πρώτη κράτηση."`
   - Each row is a tappable card linking to `/dashboard/customers/[id]`.

2. **Customer detail page** at `/dashboard/customers/[id]` (server component):
   - Header: avatar + name + tappable phone (`tel:`) + tappable email (`mailto:`)
   - Section "Στατιστικά": total bookings, total spent, last booking date
   - Section "Σημειώσεις" — single textarea for `notes`, save via server action. Greek label: "Σημειώσεις για τον πελάτη"
   - Section "Επόμενη πρόταση" — single text input for `future_recommendation`. Greek label: "Επόμενη πρόταση". Placeholder: "π.χ. Καθαρισμός σε 6 μήνες" (or appropriate per vertical).
   - Section "Ιστορικό κρατήσεων" — chronological list (most recent first) of all appointments for this customer: date+time, service, status pill, paid pill, amount.
   - Back link to `/dashboard/customers` at top-left (chevron + "Πελάτες").

3. **Debts tab** at `/dashboard/debts` (server component):
   - Lists unpaid appointments where `paid=false AND status IN (scheduled, done)`. Cancelled appointments are excluded (no debt for a cancelled booking).
   - Grouped by customer (one section per customer). Each section: customer name + total owed (sum of `amount_due_cents`).
   - Within section: chronological list of unpaid appointments (date, service, amount).
   - One-tap action on each appointment: "💶 Πληρώθηκε" — toggles `paid=true`, removes from view via `router.refresh()`.
   - Section header counter at top: `"Σύνολο οφειλών: €X,XX από Y πελάτες"`.
   - Empty state: `"Καμία οφειλή. Όλα πληρωμένα."` (warm).
   - Tappable customer name links to `/dashboard/customers/[id]`.

4. **APIs (owner-only):**
   - `GET /api/v1/businesses/:id/customers?search=...` — paginated, returns `{ customers: [{ id, name, email, phone, last_appointment_at, appointments_count, total_spent_cents }], next_cursor }`.
   - `GET /api/v1/customers/:id` — returns `{ customer, appointments: [...with service summary] }`, scoped to owner's business.
   - `PATCH /api/v1/customers/:id` — accepts `{ notes?, future_recommendation? }`. Returns `{ customer }`.
   - All routes scope-check to owner's business (no cross-business leakage).

5. **No new e2e test required** for this chunk — too many trivial flows. Add a single Playwright test `dashboard-customers.spec.ts`: log in, navigate to /dashboard/customers, verify the seeded customer appears (from the booking-flow seed in chunks #4-6), tap → detail page renders → save a note → reload → note persists. Under 15 seconds.

6. `pnpm -r typecheck` + Docker build + all existing e2e tests still green.

## What's already in repo — do NOT modify

- `infra/*`, `.github/workflows/`, all settled infra
- All chunks #1-6 files except those explicitly listed under "Modify" below
- Today + Appointments tabs (chunk #6) — they're done, don't touch
- The booking flow client components (chunk #4), email layer (chunk #5)
- Settings/services + Settings/visibility sub-routes (chunks #2, #3)

## Files you MUST create or modify (closed list)

### Server-side data layer

- `apps/web/src/lib/customers.ts` — server-only functions, all JSDoc'd:
  - `listCustomers(businessId, { search?, cursor?, take? }): Promise<{ items, nextCursor }>` — joins appointments for last_appointment_at + appointments_count + total_spent_cents.
  - `getCustomer(businessId, customerId): Promise<CustomerDetail | null>` — includes appointments with service summary.
  - `updateCustomer(businessId, customerId, patch): Promise<void>` — accepts `notes?`, `future_recommendation?`.
  - `listUnpaidByCustomer(businessId): Promise<Array<{ customer, appointments: [...], total_owed_cents }>>` — for debts tab.

### API routes

- **CREATE** `apps/web/src/app/api/v1/businesses/[id]/customers/route.ts` — GET. Owner-only. Search + pagination.
- **CREATE** `apps/web/src/app/api/v1/customers/[id]/route.ts` — GET + PATCH. Owner-scoped via lookup of customer.businessId.

### Shared schemas

- `packages/shared/src/api/customers.ts` — zod schemas:
  - `listCustomersQuerySchema` — search?, cursor?, take?
  - `updateCustomerSchema` — notes? (max 2000), future_recommendation? (max 500). Refine: at least one present.
  - `CustomerSummaryDTO`, `CustomerDetailDTO`, `AppointmentInCustomerDTO` types.
- **MODIFY** `packages/shared/src/index.ts` — re-export.

### Pages

- **REPLACE** `apps/web/src/app/(protected-dashboard)/dashboard/customers/page.tsx` — server component.
- **CREATE** `apps/web/src/app/(protected-dashboard)/dashboard/customers/[id]/page.tsx` — server component with `generateMetadata` for the customer name.
- **CREATE** `apps/web/src/app/(protected-dashboard)/dashboard/customers/[id]/actions.ts` — `saveCustomerNotes(customerId, formData)` server action.
- **REPLACE** `apps/web/src/app/(protected-dashboard)/dashboard/debts/page.tsx` — server component.
- **CREATE** `apps/web/src/app/(protected-dashboard)/dashboard/debts/actions.ts` — `markDebtPaid(appointmentId)` server action that reuses `togglePaid` logic (or imports it). Revalidates /dashboard/debts and /dashboard/today and /dashboard/appointments.

### Components

- `apps/web/src/components/dashboard/CustomerCard.tsx` — list row. Avatar circle (initial + indigo bg), name, contact summary, last booking date, count badge. ≥44px tap target. Whole row is a Link.
- `apps/web/src/components/dashboard/CustomerAvatar.tsx` — extract for reuse (used in CustomerCard + CustomerDetail header). Reads `name` prop, shows uppercase first letter.
- `apps/web/src/components/dashboard/CustomerSearchBox.tsx` — client component, debounced 300ms, URL-driven via `useRouter().push`. Same pattern as AppointmentsFilters from chunk #6.
- `apps/web/src/components/dashboard/CustomerStatsBlock.tsx` — server component receiving customer + computed stats. Three large numbers: total bookings, total spent, last booking. Greek labels.
- `apps/web/src/components/dashboard/CustomerNotesForm.tsx` — client component. Two fields: notes (textarea, autoresize OR fixed 4 rows), future_recommendation (single line). Save button at bottom. Uses server action passed as prop. Optimistic "Αποθηκεύτηκε" toast on success (2 seconds).
- `apps/web/src/components/dashboard/CustomerAppointmentRow.tsx` — compact row for the customer's appointment history. Date+time, service, status pill, paid pill, amount. Subtle background variation for cancelled.
- `apps/web/src/components/dashboard/DebtSection.tsx` — one customer's debts. Header with customer name (link) + total. Body: list of `DebtRow`.
- `apps/web/src/components/dashboard/DebtRow.tsx` — single unpaid appointment row. Date, service, amount, one-tap "Πληρώθηκε" button.

### Docs

- **MODIFY** `docs/CODEX_TASKS.md` — mark TASK-014, TASK-015 done. TASK-016 (Notifications settings tab) becomes next-pending; TASK-017 (Settings profile editor) too. Chunk #8 will likely tackle reminder scheduler (TASK-020) first since notifications-tab toggles are blocked on the scheduler existing.
- **MODIFY** `docs/API.md` — sync the customers routes if the response shape differs from the documented one (add the computed fields `last_appointment_at`, `appointments_count`, `total_spent_cents` if not already there).

## Dependencies

**None new.** All primitives in place. If you genuinely need one, stop and ask.

## Hard rules

- TypeScript strict. No `any` without justification.
- Tailwind + existing shadcn primitives. No inline styles. No CSS modules.
- Mobile-first 360×800. Tap targets ≥44px.
- **Greek copy per DESIGN.md §10 — strict.** Audit every Greek string you write against the rules:
  - Prefer "κράτηση" / "κρατήσεις" over "ραντεβού"
  - When using "ραντεβού", anchor with service name OR business name OR countable context
  - Never use "ραντεβού" alone in a heading or button label
  - Greeting style: εσύ informal, warm, short sentences
  - Empty states warm ("Καμία οφειλή. Όλα πληρωμένα.", not "No data")
- Counter labels mandatory pattern: `{N} κρατήσεις συνολικά`, `Σύνολο οφειλών: €X,XX`. No ambiguous singular "ραντεβού".
- Snake_case JSON keys. camelCase Prisma fields with `@map`.
- Server is source of truth — all queries scoped to owner's business in a single helper (don't duplicate the auth check across routes).
- Time/currency rendering: `Intl.DateTimeFormat("el-GR", { timeZone: business.timezone })` for dates, `Intl.NumberFormat("el-GR", { style: "currency", currency: service.currency })` for money. Never hardcode "€".
- Server actions revalidate the relevant paths after mutation.
- No new npm packages.
- No placeholder/TODO. Notifications + Settings tabs stay as their existing placeholders (intentional).

## Pre-flight: grep audit

Before declaring done, run a grep on your diff for the literal word "ραντεβού" and verify EVERY occurrence is anchored per DESIGN.md §10 rules. If any line fails the audit, rewrite it. Report your audit result in the output.

## Acceptance criteria — run all

```bash
pnpm install
pnpm -r typecheck
pnpm --filter @radevu/db generate
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d --build web
sleep 30
curl -s http://localhost:3000/api/health
pnpm --filter @radevu/web test:e2e      # existing tests + new dashboard-customers.spec.ts
```

Manual at 360×800:
- Log in as seeded owner
- Book a slot as guest on /test-shop (creates a customer + appointment)
- /dashboard/customers → see the customer row
- Tap → detail page → see history, save a note → reload → note persists
- /dashboard/debts → see the unpaid appointment → tap "Πληρώθηκε" → disappears from view
- Search by partial name on /dashboard/customers → filter works
- Visit a customer with no past appointments → graceful empty state in history section

API contract:
- `GET /api/v1/businesses/:id/customers` as owner → returns owned customers
- Same call as different owner → 403 or empty (document which)
- `GET /api/v1/customers/<id-of-other-business>` → 403
- `PATCH /api/v1/customers/:id` with `{ notes: "" }` → 200, clears
- PATCH with neither field → 400 VALIDATION_ERROR

## Output format

Per `booking-saas-codex-context` §6:
- `## File: <path>` blocks
- Trailing `## Dependencies added` (expected: "None.")
- Trailing `## Files that need updating due to this change`
- **NEW:** Trailing `## ραντεβού audit` section — paste the grep results from your pre-flight, comment on each occurrence (anchored / anchor type)
- Self-check before returning

Scope: ONLY handoff-007.md. Notifications + Settings profile editor + reminder scheduler stay for chunks #8+. Stop when acceptance passes.
