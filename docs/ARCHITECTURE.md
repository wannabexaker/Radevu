# Architecture

Source of truth for system boundaries, request flow, and data flow. Update on every change that touches architecture.

## 1. System overview

Single Next.js 15 app handling both the public booking pages (subdomain or subpath) and the owner dashboard. Backed by PostgreSQL 16 (Prisma) and Redis 7 (sessions, rate limit, reminder queue). Deployed via Coolify in a Docker container on a Raspberry Pi 4 during Beta Phase 0–1 and on Hetzner CAX21 in Production.

Email (Resend) and Cloudflare DNS/Tunnel are the only external dependencies. Both are reached over outbound HTTPS — no inbound ports need to be open on the host.

## 2. Apps and packages

| Path | Role |
|------|------|
| `apps/web` | Single Next.js 15 app. Routes for public booking pages, owner dashboard, API. |
| `packages/db` | Prisma schema + generated client. Single source of truth for the data model. |
| `packages/email` | React Email templates + Resend sender. |
| `packages/shared` | Cross-cutting TS types, zod validation schemas, constants. |
| `infra/` | docker-compose, Coolify configs, backup scripts, cloudflared template. |

## 3. Routing modes (env-driven)

Controlled by `ROUTING_MODE`:

| Mode | Public URL | Dashboard URL | Triggered in |
|------|------------|---------------|--------------|
| `subpath` | `http://radevu.local:3000/<slug>` | `http://radevu.local:3000/dashboard` | Beta Phase 0 (LAN-only) |
| `subdomain` | `https://<slug>.radevu.gr` | `https://dashboard.radevu.gr` | Beta Phase 1+, Production |

Middleware in `apps/web/middleware.ts` reads `Host` header (subdomain mode) or first path segment (subpath mode) and rewrites to the appropriate `app/[business]/...` or `app/dashboard/...` route group. Code must never hardcode the domain or the mode — both come from env.

## 4. Subdomain routing (Beta Phase 1+)

Cloudflare wildcard DNS record: `*.radevu.gr → tunnel UUID`. `cloudflared` on the Pi forwards to `localhost:3000`. Middleware extracts subdomain, looks up business by slug, attaches to request context.

Reserved subdomains never routed to a business: `www`, `app`, `api`, `admin`, `dashboard`, `mail`, `status`, `radevu`.

## 5. Auth flow

better-auth with email/password provider serves both business owners and customers. Session data is stored in Postgres via better-auth's Prisma adapter. Cookies are HttpOnly + SameSite=Lax + Secure in production.

`User.userType` is the role switch:
- `business_owner` can access `/dashboard/*`, own one `Business`, and manage services, appointments, customers, debts, notifications, and business settings.
- `customer` can access `/account/*`, manage their account profile, and view appointments linked through `Customer.userId`.

Customer accounts are supported, but guest booking remains the default fast path. A customer can still book without logging in; booking submit identifies or creates the business-scoped `Customer` row by email or phone.

Email verification is soft. Users can log in immediately after registration, but unverified sessions see a verification banner in account/dashboard layouts. Account-to-customer linking is gated: a booking only stamps `Customer.userId` when the session is a verified customer and the booking email matches the session email. Unverified customer sessions remain guest-compatible.

Password recovery uses better-auth reset tokens with the Radevu email template. Forgot-password is no-enumeration after anti-abuse checks. Authenticated change-password revokes other sessions.

## 6. Booking flow (end-to-end)

1. Customer opens `<slug>.radevu.gr` (or `radevu.local:3000/<slug>` in Beta Phase 0).
2. SSR: business profile + services + working hours rendered server-side.
3. Customer picks service → booking modal shows a month calendar with per-day availability density dots.
4. Customer picks date → `GET /api/v1/businesses/:id/availability?service_id&date` returns free slots.
5. Customer picks slot → form (name, phone, email).
6. Submit → `POST /api/v1/appointments` → creates appointment + auto-creates/updates customer record (key=email or phone) → enqueues confirmation email + .ics.
7. Confirmation screen rendered + `.ics` download link.

Budget: complete from step 1 to step 7 in < 60 seconds on mid-range Android over 4G.

Slot generation is timezone-aware and DST-safe: wall-clock times are converted with `Intl.DateTimeFormat` using the business timezone, nonexistent DST times are skipped, and repeated fall-back wall times are collapsed to one customer-visible slot. Availability and booking POST both enforce a 60-minute minimum notice and a 90-day maximum horizon server-side.

## 7. Email pipeline

Resend transactional via `RESEND_API_KEY` and `RESEND_FROM_EMAIL`. Booking emails
use the display sender `Radevu <RESEND_FROM_EMAIL>`.

Templates in `packages/email`:
- `BookingConfirmation` — customer, with `.ics` attached.
- `OwnerNewBookingAlert` — owner.
- `BookingReminder` — customer, configurable lead time (default 24h), done in chunk #10.
- `ContactRequestNotification` — founder notification for landing-page leads.

Booking confirmation sends are fire-and-forget after the appointment transaction
commits. The booking API returns `201` even if Resend fails; every email failure
is logged with appointment id and recipient context. The owner alert links to
`${BETTER_AUTH_URL}/dashboard/appointments` and is sent to the business
`contact_email`, falling back to the owner login email. `BOOKING_OWNER_ALERT_EMAIL_OVERRIDE`
exists only for sandbox/debug routing. `CONTACT_NOTIFICATION_EMAIL` is reserved
for founder-facing landing-page contact requests. Landing contact requests are
stored in `contact_requests` before the notification is sent. Contact notification
sends are best-effort; failures are recorded on the row and never fail the public
submit.

Reminder scheduling: Redis-backed delayed queue using sorted set `radevu:reminders`. Appointment ids are scored by due timestamp in milliseconds. The worker process in the same Next.js container polls every 60 seconds, atomically claims due jobs with a Lua `ZRANGEBYSCORE` + `ZREM`, sends best-effort reminders, and does not retry Resend failures in Phase 1. The single-process worker is acceptable for one host; Phase 2 may extract to a dedicated worker if load demands.

## 8. Database schema (high level)

See `packages/db/prisma/schema.prisma` for the authoritative version.

Models (Phase 1):

- **Business** — id, slug (unique), name, category (nullable), description (nullable), contact_email, contact_phone, timezone, working_hours (jsonb), logo_url, photo_url, social_links (jsonb), maps_url, notification_settings (jsonb), owner_id, created_at.
- **Service** — id, business_id, name, duration_minutes, price_cents, currency, description, active, created_at.
- **Customer** — id, business_id, user_id (nullable FK to User, `SET NULL` on delete), name, email, phone, future_recommendation (text), notes (text), reminder_dates (jsonb), created_at. UNIQUE(business_id, email) and UNIQUE(business_id, phone) — at least one must be present.
- **Appointment** — id, business_id, customer_id, service_id, starts_at, ends_at, status (enum: scheduled, done, cancelled), paid (boolean), amount_due_cents, notes (owner-private text), customer_note (customer-visible text), customer_private_note (token-page private text), guest_token_hash, guest_token_expires_at, created_at.
- **AppointmentMessage** — id, business_id, appointment_id, author_role (enum: business, customer), body, created_at. Used for shared replies between the owner dashboard and the secure customer appointment page.
- **ContactRequest** — id, name, email, phone, message, notification_sent, notification_error, created_at.
- **User** — better-auth model for business owners and customers, with `userType`, `phone`, `marketingOptIn`, and email verification state.

`Business.working_hours` is stored as a complete weekly JSON object. Keys are fixed to `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun`; each value is an ordered list of wall-clock intervals:

```json
{
  "mon": [{ "open": "09:00", "close": "17:00" }],
  "tue": [{ "open": "09:00", "close": "17:00" }],
  "wed": [{ "open": "09:00", "close": "17:00" }],
  "thu": [{ "open": "09:00", "close": "17:00" }],
  "fri": [{ "open": "09:00", "close": "17:00" }],
  "sat": [],
  "sun": []
}
```

## 9. Environments

| Env | DB | Redis | Email | Domain | ROUTING_MODE |
|-----|-----|-------|-------|--------|---------------|
| Dev (laptop) | Docker Postgres | Docker Redis | Resend test key | `localhost` | `subpath` |
| Beta Phase 0 (Pi LAN) | Pi Postgres | Pi Redis | Resend live | `radevu.local` | `subpath` |
| Beta Phase 1 (Pi + Tunnel) | Pi Postgres | Pi Redis | Resend live | `radevu.gr` | `subdomain` |
| Production (Hetzner) | Hetzner Postgres | Hetzner Redis | Resend live | `radevu.gr` | `subdomain` |

All env vars listed in `infra/.env.example`.

## 10. Backup strategy

Beta Phase 0–1 (Pi): nightly cron at 03:15 → `pg_dump` to `/mnt/backup/radevu/postgres/daily/YYYY-MM-DD.sql.gz` and `tar` of `/srv/radevu/uploads/` to `/mnt/backup/radevu/uploads/daily/YYYY-MM-DD.tar.gz`. Both on the external USB SSD. Retention: 30 daily, 12 monthly. See `infra/backup.sh`.

Production: same script + weekly rsync to Hetzner Storage Box.

## 11. Deploy topology

Coolify watches GitHub repo `main` branch. On push: pull → build (Next.js standalone) → swap container. Zero-downtime if RAM allows; brief restart otherwise.

Postgres and Redis are persistent Coolify services with named Docker volumes; they don't restart on app deploys.

## 12. File storage

Business images are stored on disk under `/srv/radevu/uploads`, backed by a host-mounted volume. The path layout is:

```text
/srv/radevu/uploads/<business_id>/<kind>-<timestamp>.<ext>
```

`kind` is `logo` or `photo`; extensions are `png`, `jpg`, or `webp`. Phase 1 stores original uploaded images only. Browser display sizing handles thumbnails; server-side resizing is deferred.

Public image reads go through `GET /uploads/[...path]`. The handler resolves the requested path against `UPLOAD_ROOT`, rejects traversal attempts, streams only supported image extensions, and returns immutable cache headers (`public, max-age=31536000, immutable`). Replacing or removing an image clears the database URL and deletes the old file best-effort; deletion warnings do not fail the user action.

Demo businesses Despoina and Ioannis are seeded with Unsplash photo URLs (external, bypassing `/uploads/`). Real businesses use the upload flow, which stores files under `/srv/radevu/uploads/<business_id>/`. The Logo component falls back to typography when no logo is uploaded.

## 13. Customer accounts

Customer accounts add an optional authenticated layer on top of the guest-first booking flow.

Data model:
- `User.userType` is either `business_owner` or `customer`.
- `User.phone` and `User.marketingOptIn` store account-level profile fields.
- `Customer.userId` is nullable and points to `User.id`; deleting the user sets this field to `NULL`.
- A customer account can be linked to many business-scoped `Customer` rows, one per business relationship.

Linking rules:
- Auto-backfill on email verification links matching guest `Customer` rows by email only.
- Phone is never used for account backfill because phone ownership is not verified.
- Booking submit links `Customer.userId` only when the current session is a customer, `emailVerified` is true, and the booking email equals the account email case-insensitively.
- If any of those conditions fail, the booking remains guest-compatible and `Customer.userId` stays `NULL`.

Anti-abuse stack:
- Public register, public verification resend, and forgot-password use Turnstile + honeypot + form age + Redis rate limit through `validateAuthSecurity`.
- Authenticated verification resend and change-password use session-gated Redis rate limits through `checkRateLimit`.
- Forgot-password never reveals whether an email exists.
