# <img src="./apps/web/public/radevu-mark.png" alt="Radevu mark" width="48" align="center"> Radevu

Mobile-first booking, customer communication, and daily management for Greek service professionals

## Overview

Appointment-based professionals get a shareable public page and a private dashboard for running their day. A customer opens the page from a phone, checks services and availability, books a time, receives confirmation, and can continue the conversation around that appointment. The owner controls the public profile, schedule, customer history, unpaid balances, reminders, and appointment communication from the same application. The product is focused on booking and follow-up, not generic website building or enterprise CRM.

## Features

- **Business discovery.** Customers can search the public directory by business name or description, filter by category, and open the relevant profile and booking flow.
- **Public business page.** Each professional can publish a business name, profile photo, logo, phone, email, service list, prices, service duration, weekly working hours, Instagram and Facebook links. The page is server-rendered and can be shared directly with customers.
- **Location and directions.** The owner can save a Google Maps location link from profile settings. Customers see a dedicated “view on map” action together with the business contact details.
- **Availability-based booking.** The customer selects a service, month, day, and available time generated from the business timezone, working hours, service duration, existing appointments, and current time. Closed or occupied times cannot be selected.
- **Booking from a phone.** The booking flow is designed and tested at `360×800`: service, date, time, name, email or phone, and an optional message are completed without creating an account. Playwright enforces a booking budget below 60 seconds.
- **Automatic confirmation for both sides.** After a booking, the customer receives an email confirmation with an `.ics` calendar invitation and a secure appointment link. The business owner receives a separate new-booking alert with the appointment and customer details.
- **Configurable reminders.** The owner can enable or disable confirmation emails and customer reminders, then choose how long before the appointment the reminder is sent. Redis stores delayed reminder jobs and the worker dispatches due emails.
- **Daily appointment control.** The owner dashboard shows today’s schedule and the wider appointment list with date, status, and customer filters. Appointments can be completed, cancelled, marked paid or unpaid, and opened for notes and communication.
- **Debt tracking.** Unpaid appointments are grouped by customer, with totals per customer and a total outstanding balance for the business. A payment can be cleared with one action, and the change is reflected across appointments, customers, debts, and the daily view.
- **Customer history and CRM notes.** A customer record is created or updated from each booking. The owner can search customers, call or email them directly, review appointment history and spending totals, keep internal notes, and record the next recommended service or follow-up.
- **Appointment conversation.** Customers and the business share a message thread attached to the appointment. Guests enter through the secure link from their confirmation email; registered customers use their account. Each side also has a separate private note that is not shown to the other side.
- **Customer accounts without blocking guest booking.** Registered customers can review their appointments, open appointment details, exchange messages, update account information, verify email, and recover or change their password. Guest booking remains available for the shortest path.
- **Business settings.** The owner can update profile images and contact information, edit services, configure weekly hours, control directory visibility, and manage notification preferences without changing code.
- **Mobile-first owner workflow.** The dashboard uses a fixed bottom navigation for schedule, appointments, customers, debts, notifications, and settings. Core actions use phone-sized controls and direct `tel:` or `mailto:` links where contact data exists.
- **Access and abuse controls.** Customer and business-owner roles are separated, owner queries are scoped to their own business, and private appointment links store only token hashes. Registration and password flows use email verification, Turnstile, honeypots, rate limits, and non-enumerating password recovery responses.

## Architecture

A single Next.js App Router application serves the landing page, directory, public profiles, customer accounts, owner dashboard, and `/api/v1` routes. Middleware selects subpath or subdomain routing from environment configuration. Route handlers enforce authentication and tenant boundaries before Prisma accesses PostgreSQL; Redis provides rate limiting and reminder queues.

### Components

| Component | Role |
|---|---|
| `apps/web` | SSR pages, booking UI, account/dashboard routes, middleware, and API handlers |
| `packages/db` | Prisma schema, migrations, generated client, and development/e2e seeds |
| `packages/email` | React Email templates, Resend delivery, and ICS generation |
| `packages/shared` | zod schemas, DTO types, constants, and date/time helpers |
| `infra` | Docker Compose, container hardening, backups, and production configuration |
| `scripts` | Local database helpers, Pi updates, fixture cleanup, and password rotation |

## Tech Stack

| Technology | Role |
|---|---|
| Node.js 22, pnpm 9 | Runtime and workspace package management |
| Next.js 15, React 18, TypeScript 5.6 | Web application |
| PostgreSQL 16, Prisma 5.22 | Relational data and migrations |
| Redis 7, ioredis | Rate limiting and reminder queues |
| better-auth | Customer and business-owner authentication |
| Resend, React Email | Transactional email and calendar invitations |
| Tailwind CSS, Radix UI, Lucide | Interface styling and primitives |
| Playwright, Node test runner | End-to-end and unit tests |
| Docker Compose, GitHub Actions, GHCR | Local services and ARM64 image delivery |

## Installation

```powershell
git clone https://github.com/wannabexaker/Radevu.git
Set-Location Radevu
corepack pnpm install
Copy-Item infra/.env.example infra/.env
```

For local development, set `NODE_ENV=development`, `BETTER_AUTH_URL=http://localhost:3000`, and non-empty PostgreSQL/auth secrets in `infra/.env`.

## Usage

```powershell
corepack pnpm dev:infra
corepack pnpm db:migrate:local
corepack pnpm db:seed:local
corepack pnpm --filter @radevu/web dev
```

The application runs at `http://localhost:3000`.

- Directory: `http://localhost:3000/epaggelmaties`
- Public profile: `http://localhost:3000/<business-slug>`
- Owner login: `http://localhost:3000/dashboard/login`
- Health check: `http://localhost:3000/api/health`

Run validation with the application and local infrastructure active:

```powershell
corepack pnpm -r typecheck
corepack pnpm -r test
corepack pnpm --filter @radevu/web exec playwright test
```

## Project Structure

```text
Radevu/
├── apps/web/                  — Next.js application and Dockerfile
├── packages/db/               — Prisma data layer and seeds
├── packages/email/            — Transactional email and ICS output
├── packages/shared/           — Shared validation and date helpers
├── infra/                     — Local and production Compose configuration
├── scripts/                   — Database, deployment, and maintenance tools
├── docs/                      — Architecture, API, design, and operations docs
└── .github/workflows/         — ARM64 image build and GHCR publishing
```

## Notes

- Paid and unpaid states provide balance tracking; the application does not process card payments.
- Local Docker exposes PostgreSQL on `localhost:5433` and Redis on `localhost:6379`; the project helper scripts adapt `infra/.env` automatically.
- `BETTER_AUTH_URL` must be `http://localhost:3000` locally. A production URL causes authenticated e2e requests to fail with `403`.
- Production seeds require secret `SEED_*_PASSWORD` values. Password rotation is documented in [`docs/ops/rotate-owner-passwords.md`](docs/ops/rotate-owner-passwords.md).
- Timestamps are stored in UTC and rendered in each business timezone.
- Pushes to `main` build a `linux/arm64` image and publish `latest` plus SHA tags to GHCR.
- Deployment and operations references live in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/API.md`](docs/API.md), [`docs/CLOUDFLARE.md`](docs/CLOUDFLARE.md), and [`infra/SETUP.md`](infra/SETUP.md).
- No open-source license is currently granted.
