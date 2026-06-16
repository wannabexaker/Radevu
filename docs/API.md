# API Reference

Every route change must update this document in the same handoff. If code and `API.md` disagree, the code is wrong until proven otherwise.

## Conventions

- Base path: `/api/v1`
- Resources: plural, lowercase, hyphenated multi-word.
- HTTP: `GET` read, `POST` create, `PATCH` partial update, `DELETE` remove. No `PUT`.
- Success: `200` (read/update), `201` (create with body), `204` (delete, no body).
- Errors: JSON `{ "error": { "code": "string", "message": "string", "details"?: object } }` with appropriate HTTP status.
- Validation: zod schemas in `packages/shared`. `400` with `code: "VALIDATION_ERROR"` on failure.
- Auth: better-auth session cookie. Owner-only routes return `401` without session, `403` if session does not own the resource.

## Routes

### Auth

| Method | Path | Auth | Body | Returns |
|--------|------|------|------|---------|
| `POST` | `/api/v1/auth/register` | Public + anti-abuse | Customer: `{ user_type: "customer", email, password, name, phone?, marketing_opt_in?, turnstile_token, honeypot?, form_started_at }`; Business owner: `{ user_type: "business_owner", email, password, name, phone?, marketing_opt_in?, business_name, slug, turnstile_token, honeypot?, form_started_at }` | `201 { user, business, redirect_to }` |
| `POST` | `/api/v1/auth/verification/resend` | Public + anti-abuse | `{ email, turnstile_token, honeypot?, form_started_at }` | `200 { ok: true }` |
| `POST` | `/api/v1/auth/password/forgot` | Public + anti-abuse | `{ email, turnstile_token, honeypot?, form_started_at }` | `200 { ok: true }` |
| `POST` | `/api/v1/auth/password/reset` | Public + IP rate-limit | `{ token, new_password }` | `200 { ok: true }` |

`/api/v1/auth/register` is a discriminated union on `user_type`. `customer` creates a customer account and redirects to `/account`; `business_owner` also creates the business profile and redirects to `/dashboard/today`. The public auth forms use Turnstile, honeypot, form age, and Redis rate limiting through `validateAuthSecurity`.

`/api/v1/auth/verification/resend` returns the same `200 { ok: true }` for unknown emails, already verified users, and successful sends so account existence is not exposed. Validation and anti-abuse failures still return typed errors. In the current implementation, an email provider failure returns `500 SERVER_ERROR`.

`/api/v1/auth/password/forgot` is no-enumeration: after valid anti-abuse checks, it always returns `200 { ok: true }`; internal send/provider errors are logged and not leaked.

`/api/v1/auth/password/reset` uses the better-auth reset token from the email link. Invalid, expired, or already used tokens return `400 { error: { code: "INVALID_TOKEN", message } }`. `new_password` must be 10-128 characters.

### Me

Session-gated routes for the currently logged-in user.

| Method | Path | Auth | Body / Query | Returns |
|--------|------|------|--------------|---------|
| `GET` | `/api/v1/me` | Session | - | `200 { user, business }` |
| `PATCH` | `/api/v1/me` | Session | `{ name?, phone?, marketing_opt_in? }` | `200 { user }` |
| `GET` | `/api/v1/me/appointments` | Customer session | `?view=upcoming\|past` | `200 { appointments }` |
| `POST` | `/api/v1/me/verification/resend` | Session | - | `200 { ok: true }` |
| `POST` | `/api/v1/me/change-password` | Session | `{ current_password, new_password }` | `200 { ok: true }` |

`GET /api/v1/me` returns the shared user profile fields (`id`, `email`, `email_verified`, `name`, `phone`, `marketing_opt_in`, `user_type`) and, for business owners, the owned business summary.

`GET /api/v1/me/appointments` is customer-only and currently supports `?view=upcoming` or `?view=past`; it returns up to 50 appointments linked through `Customer.userId`.

`POST /api/v1/me/verification/resend` is session-gated, uses `checkRateLimit` with `me-verify-resend|<userId>` at 3 requests per 15 minutes, and does not require Turnstile because the session is already established. Verified users receive a no-op `200 { ok: true }`.

`POST /api/v1/me/change-password` validates `current_password` and `new_password`, calls better-auth `changePassword`, and revokes other sessions. Wrong current password returns `400 { error: { code: "INVALID_CREDENTIALS", message } }`.

### Businesses

Business owner registration now happens through `POST /api/v1/auth/register`. Slugs `ioannis`, `giannis`, and `despoina` are pre-claimed by the founder for the live demo and are rejected during auth registration with `400 SLUG_RESERVED`.

| Method | Path | Auth | Body / Query | Returns |
|--------|------|------|--------------|---------|
| `GET` | `/api/v1/businesses/:id` | Public for booking page, Owner for full | - | `200 { business }` |
| `PATCH` | `/api/v1/businesses/:id` | Owner of `:id` | `{ name?, contact_email?, contact_phone?, logo_url?, photo_url?, social_links?, maps_url?, working_hours? }` | `200 { business }` |
| `POST` | `/api/v1/businesses/:id/upload` | Owner of `:id` | Multipart `{ kind: "logo"\|"photo", file }` | `201 { url }` |
| `PATCH` | `/api/v1/businesses/:id/notifications` | Owner of `:id` | `{ confirmation_enabled?, reminder_enabled?, reminder_lead_minutes? }` | `200 { business: { id, notification_settings } }` |
| `PATCH` | `/api/v1/businesses/:id/visibility` | Owner of `:id` | `{ show_on_landing }` | `200 { business: { id, show_on_landing } }` |

Business profile updates use snake_case JSON keys. `logo_url` and `photo_url` accept `/uploads/...` URLs or `null` to clear. `social_links` accepts `{ instagram?, facebook? }` with allowlisted hosts only. `maps_url` accepts Google Maps hosts only. `working_hours` is a complete weekly object with `mon` through `sun`, each containing `{ open, close }` intervals in `HH:mm`.

`POST /api/v1/businesses/:id/upload` accepts only `image/png`, `image/jpeg`, and `image/webp` up to 5MB. Invalid type returns `400 INVALID_TYPE`; oversized files return `413 FILE_TOO_LARGE`.

`GET /uploads/[...path]` is a public static-style route for stored business images. It streams files from `/srv/radevu/uploads`, rejects unsafe paths, and returns immutable cache headers.

Notification settings responses use snake_case JSON keys:

```json
{
  "business": {
    "id": "business_id",
    "notification_settings": {
      "confirmation_enabled": true,
      "reminder_enabled": true,
      "reminder_lead_minutes": 1440
    }
  }
}
```

`reminder_lead_minutes` must be one of `720`, `1440`, or `2880`. Invalid values return `400 VALIDATION_ERROR`.

### Services

| Method | Path | Auth | Body / Query | Returns |
|--------|------|------|--------------|---------|
| `GET` | `/api/v1/businesses/:id/services` | Public or Owner | `?active=true\|false` | `200 { services }` |
| `POST` | `/api/v1/businesses/:id/services` | Owner | `{ name, duration_minutes, price_cents, description? }` | `201 { service }` |
| `PATCH` | `/api/v1/services/:id` | Owner | `{ name?, duration_minutes?, price_cents?, description?, active? }` | `200 { service }` |
| `DELETE` | `/api/v1/services/:id` | Owner | - | `204` |

Service responses use snake_case JSON keys:

```json
{
  "id": "service_id",
  "business_id": "business_id",
  "name": "Haircut",
  "duration_minutes": 30,
  "price_cents": 1500,
  "currency": "EUR",
  "description": "Optional service description",
  "active": true,
  "created_at": "2026-05-19T10:00:00.000Z",
  "updated_at": "2026-05-19T10:00:00.000Z"
}
```

Public `GET /api/v1/businesses/:id/services` responses are always filtered to active services. Owners receive all services by default and can pass `?active=true` or `?active=false` to filter.

### Contact Requests

| Method | Path | Auth | Body | Returns |
|--------|------|------|------|---------|
| `POST` | `/api/v1/contact-requests` | Public | `{ name, email, phone?, message }` | `201 { ok: true }` |

Contact requests are stored in `contact_requests` before notification delivery. Invalid input returns `400 { error: { code: "VALIDATION_ERROR", message, details } }`. Persistence failures return `500 { error: { code: "SERVER_ERROR", message } }`. Email notification failures are logged and recorded on the contact request row; they do not fail the public submit.

### Availability

| Method | Path | Auth | Query | Returns |
|--------|------|------|-------|---------|
| `GET` | `/api/v1/businesses/:id/availability` | Public | `?service_id&date=YYYY-MM-DD` | `200 { slots: [{ starts_at, ends_at }] }` |
| `GET` | `/api/v1/businesses/:id/availability/month` | Public | `?service_id&year=YYYY&month=1-12` | `200 { days: [{ date, slot_count, state }] }` |

Availability endpoints enforce a 60-minute minimum notice and a 90-day maximum booking horizon. Daily availability returns `400 PAST_DATE` for dates before today and `400 BEYOND_HORIZON` for dates more than 90 days out. Month availability returns `400 PAST_MONTH` for past months and `400 BEYOND_HORIZON` for months beyond the 90-day horizon.

Month availability responses use snake_case JSON keys:

```json
{
  "days": [
    {
      "date": "2026-05-25",
      "slot_count": 12,
      "state": "open"
    },
    {
      "date": "2026-05-26",
      "slot_count": 2,
      "state": "tight"
    }
  ]
}
```

Month day `state` is one of `closed`, `full`, `tight`, `available`, or `open`.

### Appointments

| Method | Path | Auth | Body / Query | Returns |
|--------|------|------|--------------|---------|
| `POST` | `/api/v1/appointments` | Public (guest booking) | `{ business_id, service_id, starts_at, customer: { name, email?, phone? }, note? }` | `201 { appointment, customer_manage_url }` |
| `GET` | `/api/v1/appointments` | Owner | `?from=ISO&to=ISO&status=scheduled,done,cancelled&customer_q&cursor&take=50` | `200 { appointments, next_cursor }` |
| `GET` | `/api/v1/appointments/:id` | Owner | - | `200 { appointment }` |
| `PATCH` | `/api/v1/appointments/:id` | Owner | `{ status?, paid?, notes? }` | `200 { appointment }` |

Public guest booking responses use snake_case JSON keys:

```json
{
  "appointment": {
    "id": "appointment_id",
    "business_id": "business_id",
    "customer_id": "customer_id",
    "service_id": "service_id",
    "starts_at": "2026-05-25T07:00:00.000Z",
    "ends_at": "2026-05-25T07:30:00.000Z",
    "status": "scheduled",
    "paid": false,
    "amount_due_cents": 1500,
    "currency": "EUR",
    "customer_name": "Customer Name",
    "service_name": "Haircut"
  },
  "customer_manage_url": "https://example.com/appointments/appointment_id?token=secure_token"
}
```

If a slot is taken between availability lookup and booking submit, the route returns `409 { error: { code: "SLOT_TAKEN", message } }`.

Guest booking POST also enforces the booking window server-side. A start time less than 60 minutes from the server clock returns `400 { error: { code: "TOO_SOON", message } }`. A start time more than 90 days out returns `400 { error: { code: "BEYOND_HORIZON", message } }`.

Guest booking remains the default fast path and does not require a session. When a request has a logged-in customer session, `currentUser.emailVerified === true`, and the booking email matches the session email case-insensitively, the created or updated `Customer` row is linked with `Customer.userId`. If there is no session, the session is not a customer, the customer email is unverified, or the booking email does not match the session email, the booking stays guest-compatible and `Customer.userId` remains `null`.

`note` on guest booking is customer-visible and is stored as `customer_note`.
Owner-private appointment notes are stored in `notes` and are only writable by
the owner dashboard. Shared replies are stored in `appointment_messages`.
`customer_manage_url` points to the secure customer appointment page and uses a
raw token in the URL; only the SHA-256 hash is stored in the database.

Owner appointment list and detail responses include customer and service summaries:

```json
{
  "appointments": [
    {
      "id": "appointment_id",
      "business_id": "business_id",
      "customer_id": "customer_id",
      "service_id": "service_id",
      "starts_at": "2026-05-25T07:00:00.000Z",
      "ends_at": "2026-05-25T07:30:00.000Z",
      "status": "scheduled",
      "paid": false,
      "amount_due_cents": 1500,
      "notes": null,
      "customer_note": "Customer-visible booking note",
      "messages": [
        {
          "id": "message_id",
          "author_role": "customer",
          "body": "Shared message",
          "created_at": "2026-05-25T06:30:00.000Z"
        }
      ],
      "customer": {
        "id": "customer_id",
        "name": "Customer Name",
        "email": "customer@example.com",
        "phone": "6900000000"
      },
      "service": {
        "id": "service_id",
        "name": "Haircut",
        "duration_minutes": 30,
        "price_cents": 1500,
        "currency": "EUR"
      }
    }
  ],
  "next_cursor": null
}
```

Owner routes are scoped to the current session owner's business. List calls only return that owner's rows. Detail or update calls for another business return `403 { error: { code: "FORBIDDEN", message } }`. Updating `done` to `cancelled` or any other invalid status transition returns `400 { error: { code: "INVALID_TRANSITION", message } }`.

### Customers

| Method | Path | Auth | Query | Returns |
|--------|------|------|-------|---------|
| `GET` | `/api/v1/businesses/:id/customers` | Owner | `?search&cursor&take=50` | `200 { customers, next_cursor }` |
| `GET` | `/api/v1/customers/:id` | Owner | - | `200 { customer, appointments[] }` |
| `PATCH` | `/api/v1/customers/:id` | Owner | `{ notes?, future_recommendation? }` | `200 { customer }` |

Customer summary responses use snake_case JSON keys and include computed booking stats:

```json
{
  "customers": [
    {
      "id": "customer_id",
      "business_id": "business_id",
      "name": "Customer Name",
      "email": "customer@example.com",
      "phone": "6900000000",
      "notes": null,
      "future_recommendation": null,
      "last_appointment_at": "2026-05-25T07:00:00.000Z",
      "appointments_count": 5,
      "total_spent_cents": 4500
    }
  ],
  "next_cursor": null
}
```

Customer detail responses include the same customer fields plus timestamps and booking history:

```json
{
  "customer": {
    "id": "customer_id",
    "business_id": "business_id",
    "name": "Customer Name",
    "email": "customer@example.com",
    "phone": "6900000000",
    "notes": "Prefers mornings",
    "future_recommendation": "Καθαρισμός σε 6 μήνες",
    "last_appointment_at": "2026-05-25T07:00:00.000Z",
    "appointments_count": 5,
    "total_spent_cents": 4500,
    "created_at": "2026-05-19T10:00:00.000Z",
    "updated_at": "2026-05-19T10:00:00.000Z"
  },
  "appointments": [
    {
      "id": "appointment_id",
      "business_id": "business_id",
      "customer_id": "customer_id",
      "service_id": "service_id",
      "starts_at": "2026-05-25T07:00:00.000Z",
      "ends_at": "2026-05-25T07:30:00.000Z",
      "status": "scheduled",
      "paid": false,
      "amount_due_cents": 1500,
      "notes": null,
      "service": {
        "id": "service_id",
        "name": "Haircut",
        "duration_minutes": 30,
        "price_cents": 1500,
        "currency": "EUR"
      }
    }
  ]
}
```

Owner routes are scoped to the current session owner's business. Calling `/api/v1/businesses/:id/customers` for another business returns `403`. Loading or patching a customer owned by another business returns `403`. `PATCH /api/v1/customers/:id` with neither `notes` nor `future_recommendation` returns `400 { error: { code: "VALIDATION_ERROR", message, details } }`. Sending `{ "notes": "" }` clears notes and returns `200`.
