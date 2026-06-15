# Codex Handoff #005 — Email layer: BookingConfirmation + OwnerNewBookingAlert + .ics

> **Codex CLI usage:** `cd C:\Projects\Radevu && codex` then paste this file.
> **Prerequisite:** chunks #1-4 merged. The booking POST endpoint at `apps/web/src/app/api/v1/appointments/route.ts` creates appointments + customers but does NOT send emails yet. This chunk wires the email layer in.

## Your role

Same as previous chunks. Read `C:\Users\Jiannis\.claude\skills\booking-saas-codex-context\SKILL.md` as your system prompt — follow §6 output format, §4 code style, §5 never-do list, the self-check.

Also load:
- `C:\Users\Jiannis\.claude\skills\booking-saas-project\SKILL.md`
- `C:\Projects\Radevu\docs\DESIGN.md` (§10 Greek voice/tone — applies to email copy)
- `C:\Projects\Radevu\docs\ARCHITECTURE.md` (§7 email pipeline)

## Task

Implement TASK-018 (templates) + TASK-019 (Resend wrapper + .ics generator) from `docs/CODEX_TASKS.md`. **Reminder scheduler (TASK-020) is explicitly OUT of scope** — that's chunk #6.

## Goal (testable outcome)

After this handoff:

1. When a guest completes the booking flow on `/test-shop`, the server fires two emails (fire-and-forget — never blocks the 201 response):
   - **To customer:** `BookingConfirmation` email in Greek with the appointment details + `.ics` calendar invite attached
   - **To owner:** `OwnerNewBookingAlert` email in Greek with appointment details (no `.ics` needed — the owner has the dashboard)
2. The `.ics` file is RFC 5545 compliant, opens cleanly in Apple Calendar / Google Calendar / Outlook, with: UID, DTSTART, DTEND, SUMMARY (`{service.name} — {business.name}`), LOCATION (business address if maps_url, else empty), DESCRIPTION (note if provided + business contact + maps URL).
3. Email send failures **do NOT break the booking flow** — appointment is created, response is `201`, errors are logged server-side with full context.
4. Confirmation screen copy changes from placeholder ("Θα λάβεις επιβεβαίωση στο email σου σύντομα.") to active ("Στείλαμε επιβεβαίωση στο **{customer_email}**. Έλεγξε και το spam folder.").
5. `pnpm -r typecheck` passes. Docker build green. Existing booking-flow.spec.ts still passes (< 60s).
6. New unit test `packages/email/tests/ics.test.ts` covers the .ics generator: RFC 5545 fields present, correct CRLF line endings, escaped commas/semicolons, multi-line DESCRIPTION folding at 75 chars.
7. **Live verification:** book a slot using `<your-resend-signup-email>` as customer email → both emails arrive in that inbox (Resend sandbox limits delivery to the signup address — that's fine for Phase 0).

## What's already in repo — do NOT modify

- `infra/*` (compose, Dockerfile, SETUP, .env.example — all stable)
- `.github/workflows/`
- All chunk #1-4 files except those explicitly listed under "Modify" below
- `apps/web/src/app/api/v1/contact-requests/route.ts` (chunk #3's contact email — leave alone, it's a working reference pattern for sending via Resend)

## Files you MUST create or modify (closed list)

### `packages/email/`

**Create:**

- `packages/email/src/lib/ics.ts` — pure function `generateICS(input): string`. Input: `{ uid, organizer_email, attendee_email, attendee_name, starts_at: Date, ends_at: Date, summary, location?, description?, timezone }`. Returns RFC 5545 compliant string. Use CRLF (`\r\n`) line endings. Escape commas/semicolons/backslashes per spec. Fold long lines at 75 octets per RFC 5545 §3.1. Include `METHOD:REQUEST`, `VERSION:2.0`, `PRODID:-//Radevu//Radevu//EL`. Use VEVENT with DTSTAMP, DTSTART, DTEND (UTC with Z suffix), UID, SUMMARY, DESCRIPTION, LOCATION, ORGANIZER, ATTENDEE.
- `packages/email/src/templates/BookingConfirmation.tsx` — React Email template (using `@react-email/components`). Props: `{ business_name, business_phone?, business_email?, business_maps_url?, customer_name, service_name, formatted_date, formatted_time, duration_minutes, formatted_price, note? }`. Greek copy: heading "Έγινε η κράτηση!", body explains the appointment, shows details in a card, optional note, signature "— Η ομάδα του Radevu". Mobile-friendly (single column, ≥16px text, max-width 480px). Footer: small grey text with cancel/reschedule note "Για ακύρωση ή αλλαγή ραντεβού επικοινώνησε απευθείας με την επιχείρηση."
- `packages/email/src/templates/OwnerNewBookingAlert.tsx` — React Email template. Props: `{ business_name, customer_name, customer_email?, customer_phone?, service_name, formatted_date, formatted_time, formatted_price, note?, dashboard_url }`. Greek copy: heading "Νέα κράτηση", body shows the details + contact info + a button linking to `{dashboard_url}/dashboard/appointments`. Mobile-friendly.
- `packages/email/src/sendBookingConfirmation.ts` — exports `sendBookingConfirmation(args): Promise<{ id: string }>` where args = `{ to, business, customer, service, appointment, timezone }`. Internally: generate .ics, render React Email template, call Resend with attachment. Throws on Resend failure (caller decides how to handle).
- `packages/email/src/sendOwnerNewBookingAlert.ts` — exports `sendOwnerNewBookingAlert(args): Promise<{ id: string }>`. Same shape minus attachment.
- `packages/email/tests/ics.test.ts` — vitest unit tests. Assert: RFC 5545 BEGIN/END VCALENDAR, METHOD:REQUEST, CRLF line endings, proper escaping (comma in SUMMARY → `\,`), DTSTART/DTEND in UTC Zulu format, line folding at 75 octets for long DESCRIPTION.

**Modify:**

- `packages/email/src/index.ts` — re-export the two new senders. Keep existing `sendContactRequestEmail` exported (chunk #3 pattern).

### `apps/web/`

**Modify:**

- `apps/web/src/app/api/v1/appointments/route.ts` — after the transaction commits and you have the appointment + customer + service + business, **fire both emails without awaiting** (use `void Promise.all([...]).catch(logError)` pattern or equivalent). The 201 response goes out immediately. If `customer.email` is missing, skip the customer email (don't fail). If owner has no email-relation set up yet, skip the owner email (don't fail). Log every failure with full context (appointment_id, recipient, error).
- `apps/web/src/components/booking/StepConfirmation.tsx` — update copy. Show "Στείλαμε επιβεβαίωση στο **{customer_email}**. Έλεγξε και το spam folder." when an email was sent. If the customer didn't provide an email (phone-only booking), show "Η κράτηση καταχωρήθηκε. Η επιχείρηση θα σε ενημερώσει." Pass `customer_email` from BookingFlow state down to this component.
- `apps/web/src/components/booking/BookingFlow.tsx` — ensure the confirmation step receives `customer_email`.
- `apps/web/package.json` — no new deps expected.
- `packages/email/package.json` — no new deps expected (resend + @react-email/components already there).

**Test:**

- The existing `apps/web/tests/e2e/booking-flow.spec.ts` must continue to pass without modification. Email send is fire-and-forget so it doesn't affect the 60s budget. If the test currently asserts the placeholder copy, update the assertion to match the new "Στείλαμε επιβεβαίωση" copy.

### `docs/`

- **MODIFY** `docs/CODEX_TASKS.md` — mark TASK-018 and TASK-019 done, leave TASK-020 (reminder scheduler) for chunk #6. Update the "in progress" marker.
- **MODIFY** `docs/ARCHITECTURE.md` §7 if needed to reflect the actual env vars used (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CONTACT_NOTIFICATION_EMAIL`, `BETTER_AUTH_URL` for the dashboard link in the owner alert).

## Implementation notes (do not skip)

### Owner email resolution

The Business model doesn't have a direct `owner_email` field — owner is linked via `User`. Resolve as: `business.owner.email` (from the better-auth User row joined via `Business.ownerId`). Make sure your Prisma include statement pulls the owner relation.

### Dashboard URL in owner email

Use `process.env.BETTER_AUTH_URL` — that's already the canonical app URL (`http://radevu.local:3000` in Phase 0, `https://dashboard.radevu.gr` in Phase 1+). Compose `${BETTER_AUTH_URL}/dashboard/appointments`. Read it via the existing `env` loader in `apps/web/src/lib/env.ts`, but **the email module lives in packages/email** — so accept the URL as a parameter to the sender function rather than reading env inside `packages/email`. The route handler reads env and passes it down.

### Resend `from` field

Read `RESEND_FROM_EMAIL` from env. In Phase 0 this is `onboarding@resend.dev`. Format the sender display name as `Radevu <{RESEND_FROM_EMAIL}>` so the inbox shows "Radevu" not "onboarding@resend.dev".

### Resend sandbox limitation (Phase 0 reality)

Resend sandbox (free, no domain verified) delivers ONLY to the signup email. For Phase 0 testing this means **emails only arrive at `<your-resend-signup-email>`**. When testing manually, use that email as the booking customer email. The owner-alert email also goes to that same address (via `CONTACT_NOTIFICATION_EMAIL`). Document this in code comments where relevant (e.g., next to the from-email config) so future readers don't think it's broken.

When `radevu.gr` is registered and verified in Resend, this opens up — no code change needed, just env update.

### .ics edge cases

- All-day events: NOT required (all appointments have specific times).
- Recurring events: NOT required (Phase 1 has no recurrence).
- Timezone: emit DTSTART/DTEND as `YYYYMMDDTHHMMSSZ` (UTC). Calendar clients render in user's local TZ correctly.
- UID must be unique and stable per appointment: use `appointment.id + "@radevu"` — example `cm123abc@radevu`.
- ORGANIZER: business owner email (mailto:).
- ATTENDEE: customer email (mailto:) with `RSVP=FALSE` and `PARTSTAT=ACCEPTED` (it's a confirmed booking, not an invite-with-pending-response).

### Fire-and-forget pattern

In the API route handler:

```ts
const responsePayload = { /* the 201 body */ };

// Fire-and-forget email dispatch. Do NOT await.
void (async () => {
  const dashboardUrl = `${env.BETTER_AUTH_URL}/dashboard/appointments`;
  if (customer.email) {
    try {
      await sendBookingConfirmation({ to: customer.email, business, customer, service, appointment, timezone: business.timezone });
    } catch (err) {
      console.error("[booking confirmation email failed]", { appointment_id: appointment.id, recipient: customer.email, error: err });
    }
  }
  if (business.owner.email) {
    try {
      await sendOwnerNewBookingAlert({ to: business.owner.email, dashboardUrl, business, customer, service, appointment, timezone: business.timezone });
    } catch (err) {
      console.error("[owner alert email failed]", { appointment_id: appointment.id, recipient: business.owner.email, error: err });
    }
  }
})();

return NextResponse.json(responsePayload, { status: 201 });
```

The `void` + IIFE keeps it async without blocking. Errors are caught per-email so one failure doesn't drop the other.

## Dependencies

**None new.** `resend@^4.0.1` and `@react-email/components@^0.0.28` already in `packages/email/package.json`. If you genuinely need another (don't expect to), stop and ask.

## Hard rules

- TypeScript strict. No `any` without one-line justification.
- All email body copy in Greek. Email subjects in Greek too.
- JSDoc on every exported function from `packages/email/` and on `generateICS()`.
- Explicit error handling — every Resend call wrapped in try/catch with structured logging. No silent catches.
- Email sending NEVER blocks the booking response. The 201 must go out as fast as before chunk #5 (no regression on the 60s budget).
- Read env via the central `env` loader pattern, don't `process.env.X` ad-hoc in the route handler.
- No new npm packages.
- No placeholder/TODO. The Resend sandbox limitation is documented in code comments, not as a TODO.
- No hardcoded TLDs/domains/emails — env-driven.

## Acceptance criteria — run all

```bash
pnpm install
pnpm -r typecheck
pnpm --filter @radevu/email test                    # ics.test.ts passes
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d --build web
sleep 30
curl -s http://localhost:3000/api/health            # still ok
pnpm --filter @radevu/web test:e2e                  # booking-flow still under 60s, confirmation copy updated
```

Manual verification (Resend sandbox):
- Open `http://localhost:3000/test-shop`, complete the booking flow using `<your-resend-signup-email>` as the customer email
- Both emails (BookingConfirmation + OwnerNewBookingAlert) arrive at `<your-resend-signup-email>` within ~30 seconds
- The .ics attachment opens in Google Calendar / Apple Calendar with the right time, summary, location
- The owner email's dashboard button links to `http://localhost:3000/dashboard/appointments` (Phase 0 URL)
- A booking with no email (phone only) returns 201 cleanly, no customer email sent, no error in logs
- Forcing a Resend failure (e.g., revoke API key temporarily, retry booking) → booking still succeeds with 201, error logged with full context, no user-facing error

## Output format

Per `booking-saas-codex-context` §6:
- `## File: <path>` per file
- Trailing `## Dependencies added` (expected: "None.")
- Trailing `## Files that need updating due to this change`
- Self-check before returning

Scope: ONLY handoff-005.md. Reminder scheduler (TASK-020) is chunk #6. Dashboard Today/Appointments fills = chunk #7. Stop when acceptance passes.
