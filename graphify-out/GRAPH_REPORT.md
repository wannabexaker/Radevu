# Graph Report - .  (2026-05-19)

## Corpus Check
- 0 files · ~99,999 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 274 nodes · 289 edges · 69 communities detected
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_API Route Handlers (semantic)|API Route Handlers (semantic)]]
- [[_COMMUNITY_Phase 1 MVP Task Queue + Dashboard|Phase 1 MVP Task Queue + Dashboard]]
- [[_COMMUNITY_Design System Tokens|Design System Tokens]]
- [[_COMMUNITY_API Route Files (code)|API Route Files (code)]]
- [[_COMMUNITY_Vision + Booking Flow|Vision + Booking Flow]]
- [[_COMMUNITY_Backend Infrastructure|Backend Infrastructure]]
- [[_COMMUNITY_Hosting Phases & Layout|Hosting Phases & Layout]]
- [[_COMMUNITY_Services CRUD Client|Services CRUD Client]]
- [[_COMMUNITY_Registration Page + Errors|Registration Page + Errors]]
- [[_COMMUNITY_Businesses + Visibility API|Businesses + Visibility API]]
- [[_COMMUNITY_Service Form Component|Service Form Component]]
- [[_COMMUNITY_Routing Helpers|Routing Helpers]]
- [[_COMMUNITY_Next.js Middleware|Next.js Middleware]]
- [[_COMMUNITY_Visibility Toggle Client|Visibility Toggle Client]]
- [[_COMMUNITY_framer-motion Wrapper|framer-motion Wrapper]]
- [[_COMMUNITY_Email Sender Module|Email Sender Module]]
- [[_COMMUNITY_format.ts|format.ts]]
- [[_COMMUNITY_Contact.tsx|Contact.tsx]]
- [[_COMMUNITY_Header.tsx|Header.tsx]]
- [[_COMMUNITY_layout.tsx|layout.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_layout.tsx|layout.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_BottomNav.tsx|BottomNav.tsx]]
- [[_COMMUNITY_LogoutButton.tsx|LogoutButton.tsx]]
- [[_COMMUNITY_layout.tsx|layout.tsx]]
- [[_COMMUNITY_not-found.tsx|not-found.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_ConfirmDialog.tsx|ConfirmDialog.tsx]]
- [[_COMMUNITY_IconButton.tsx|IconButton.tsx]]
- [[_COMMUNITY_Logo.tsx|Logo.tsx]]
- [[_COMMUNITY_Modal.tsx|Modal.tsx]]
- [[_COMMUNITY_ServiceCard.tsx|ServiceCard.tsx]]
- [[_COMMUNITY_About()|About()]]
- [[_COMMUNITY_Features.tsx|Features.tsx]]
- [[_COMMUNITY_Footer.tsx|Footer.tsx]]
- [[_COMMUNITY_utils.ts|utils.ts]]
- [[_COMMUNITY_ContactRequestNotification()|ContactRequestNotification()]]
- [[_COMMUNITY_next-env.d.ts|next-env.d.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_auth.ts|auth.ts]]
- [[_COMMUNITY_db.ts|db.ts]]
- [[_COMMUNITY_redis.ts|redis.ts]]
- [[_COMMUNITY_index.ts|index.ts]]
- [[_COMMUNITY_constants.ts|constants.ts]]
- [[_COMMUNITY_services.ts|services.ts]]
- [[_COMMUNITY_tailwind.config.ts|tailwind.config.ts]]
- [[_COMMUNITY_EmptyState.tsx|EmptyState.tsx]]
- [[_COMMUNITY_Hero.tsx|Hero.tsx]]
- [[_COMMUNITY_Showcase.tsx|Showcase.tsx]]
- [[_COMMUNITY_button.tsx|button.tsx]]
- [[_COMMUNITY_input.tsx|input.tsx]]
- [[_COMMUNITY_label.tsx|label.tsx]]
- [[_COMMUNITY_switch.tsx|switch.tsx]]
- [[_COMMUNITY_textarea.tsx|textarea.tsx]]
- [[_COMMUNITY_env.ts|env.ts]]
- [[_COMMUNITY_index.ts|index.ts]]
- [[_COMMUNITY_businesses.ts|businesses.ts]]
- [[_COMMUNITY_contact-requests.ts|contact-requests.ts]]

## God Nodes (most connected - your core abstractions)
1. `Phase 1 MVP Codex Task Queue` - 15 edges
2. `Handoff #001 — App Skeleton + DB + Auth + Registration` - 14 edges
3. `Handoff #002 — Services Catalog CRUD` - 12 edges
4. `Three Surfaces (Landing / Public Profile / Dashboard)` - 12 edges
5. `errorResponse()` - 10 edges
6. `POST()` - 9 edges
7. `Single Next.js App Architecture` - 9 edges
8. `Dashboard Tabs (Today, Appointments, Customers, Debts, Notifications, Settings)` - 9 edges
9. `Radevu Project` - 8 edges
10. `Main Concept (per-business mini-site + dashboard)` - 8 edges

## Surprising Connections (you probably didn't know these)
- `RESERVED_SLUGS + BUSINESS_SLUG_REGEX` --semantically_similar_to--> `Subdomain Routing + Cloudflare Wildcard`  [INFERRED] [semantically similar]
  codex\handoff-001.md → docs\ARCHITECTURE.md
- `requireOwner() Auth Pattern` --semantically_similar_to--> `better-auth Email/Password Auth Flow`  [INFERRED] [semantically similar]
  codex\handoff-002.md → docs\ARCHITECTURE.md
- `Customer Flow (<60s booking)` --semantically_similar_to--> `Booking Flow (slug → service → date → slot → confirm)`  [INFERRED] [semantically similar]
  docs\MASTER_VISION.md → docs\ARCHITECTURE.md
- `GHA Builds ARM64 → GHCR → Pi Pulls Pattern` --semantically_similar_to--> `Coolify Deploy Topology`  [INFERRED] [semantically similar]
  infra\SETUP.md → docs\ARCHITECTURE.md
- `Product Philosophy: Stable Interface` --semantically_similar_to--> `Motion Budget (zero default, lazy framer on landing)`  [INFERRED] [semantically similar]
  docs\MASTER_VISION.md → docs\DESIGN.md

## Hyperedges (group relationships)
- **6 Landing Features Grid** — handoff003_feature_online_booking, handoff003_feature_customer_history, handoff003_feature_email_calendar, handoff003_feature_mobile_first, handoff003_feature_two_taps, handoff003_feature_free_beta, handoff003_features_section [EXTRACTED 1.00]
- **Businesses Showcase Opt-In Pipeline** — handoff003_visibility_settings_page, handoff003_visibility_api, handoff003_schema_show_on_landing, handoff003_showcase_section [INFERRED 0.90]

## Communities

### Community 0 - "API Route Handlers (semantic)"
Cohesion: 0.07
Nodes (31): API Conventions (snake_case, zod, better-auth), Handler: appointments route handlers, Handler: availability route handler, Handler: contact-requests route handler, Handler: customers route handlers, Handler: services route handlers, API Route: Appointments, API Route: Availability (+23 more)

### Community 1 - "Phase 1 MVP Task Queue + Dashboard"
Cohesion: 0.1
Nodes (24): Phase 1 MVP Codex Task Queue, Handoff #001 — App Skeleton + DB + Auth + Registration, BottomNav (6 tabs sticky), Dashboard Layout with Auth Guard, /api/health Route, POST /api/v1/businesses (registration), tsconfig.base.json (strict TS), TASK-002 Infrastructure Files (done) (+16 more)

### Community 2 - "Design System Tokens"
Cohesion: 0.11
Nodes (21): Accessibility Minimums (WCAG AA, ≥44px), Color Tokens (indigo primary, slate scale), Lucide Iconography Mapping, Component Library Policy (Tailwind, shadcn-style, lucide), Button / Input / Card Primitives (≥44px), Radius + Shadow Tokens, Spacing + max-w-md Mobile Container, Three Surfaces (Landing / Public Profile / Dashboard) (+13 more)

### Community 3 - "API Route Files (code)"
Cohesion: 0.29
Nodes (11): DELETE(), errorResponse(), GET(), getSessionUserId(), PATCH(), POST(), requireOwner(), rollbackUser() (+3 more)

### Community 4 - "Vision + Booking Flow"
Cohesion: 0.13
Nodes (15): Booking Flow (slug → service → date → slot → confirm), DB Schema Overview (Business, Service, Customer, Appointment, User), 9-Step Execution Order, Never Immediately Build Rule, Orchestrator Roles (Architect, Strategist, UX, PM), Landing Page Composition (7 sections), Motion Budget (zero default, lazy framer on landing), Prisma Schema (User, Session, Account, Verification, Business, Service, Customer, Appointment) (+7 more)

### Community 5 - "Backend Infrastructure"
Cohesion: 0.14
Nodes (14): better-auth Email/Password Auth Flow, Nightly Backup Strategy (pg_dump + tar), Coolify Deploy Topology, Resend Email Pipeline + Reminder Queue, 4 Environments (Dev / Beta P0 / Beta P1 / Prod), Env-Driven Routing Modes (subpath/subdomain), Subdomain Routing + Cloudflare Wildcard, Single Next.js App Architecture (+6 more)

### Community 6 - "Hosting Phases & Layout"
Cohesion: 0.19
Nodes (13): Beta Phase 0 (Pi 4 LAN, subpath), Beta Phase 1 (Pi + Cloudflare Tunnel + radevu.gr), Production (Hetzner CAX21), Monorepo Layout (apps/web, packages/db, packages/email, packages/shared, infra, docs), Local Dev Workflow (pnpm + docker compose), Radevu Project, Tech Stack (Next.js 15, TS, Postgres, Redis, Prisma, better-auth, Tailwind, Resend), Avahi mDNS (radevu.local) (+5 more)

### Community 7 - "Services CRUD Client"
Cohesion: 0.57
Nodes (7): createService(), deleteService(), isRecord(), isService(), readErrorText(), readService(), updateService()

### Community 8 - "Registration Page + Errors"
Cohesion: 0.39
Nodes (5): fieldErrorsFromDetails(), isApiErrorResponse(), isFieldName(), isRecord(), parseErrorResponse()

### Community 9 - "Businesses + Visibility API"
Cohesion: 0.32
Nodes (8): Handler: businesses route handlers, Handler: visibility PATCH handler, API Route: Businesses, API Route: Business Visibility (PATCH), Schema Migration: show_on_landing, Landing Businesses Showcase, API: PATCH /api/v1/businesses/:id/visibility, Settings → Visibility Sub-route

### Community 10 - "Service Form Component"
Cohesion: 0.47
Nodes (3): firstFieldErrors(), handleSubmit(), parsePriceCents()

### Community 11 - "Routing Helpers"
Cohesion: 0.7
Nodes (4): isReservedSlug(), parseSubdomain(), slugFromRequest(), stripPort()

### Community 12 - "Next.js Middleware"
Cohesion: 1.0
Nodes (3): middleware(), nextWithPath(), requestHeadersWithPath()

### Community 13 - "Visibility Toggle Client"
Cohesion: 0.67
Nodes (2): isRecord(), readErrorMessage()

### Community 14 - "framer-motion Wrapper"
Cohesion: 0.67
Nodes (2): toCssValue(), toTransform()

### Community 15 - "Email Sender Module"
Cohesion: 0.83
Nodes (3): readEmailEnv(), requiredEnv(), sendContactRequestEmail()

### Community 16 - "format.ts"
Cohesion: 0.67
Nodes (0): 

### Community 17 - "Contact.tsx"
Cohesion: 0.67
Nodes (0): 

### Community 18 - "Header.tsx"
Cohesion: 0.67
Nodes (0): 

### Community 19 - "layout.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "page.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "page.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "page.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "page.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "page.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "layout.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "page.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "BottomNav.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "LogoutButton.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "layout.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "not-found.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "page.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "page.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "page.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "page.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "page.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "page.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "page.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "ConfirmDialog.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "IconButton.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Logo.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Modal.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "ServiceCard.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "About()"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Features.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Footer.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "utils.ts"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "ContactRequestNotification()"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "next-env.d.ts"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "route.ts"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "auth.ts"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "db.ts"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "redis.ts"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "index.ts"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "constants.ts"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "services.ts"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "tailwind.config.ts"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "EmptyState.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "Hero.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "Showcase.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 60 - "button.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 61 - "input.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 62 - "label.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 63 - "switch.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 64 - "textarea.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 65 - "env.ts"
Cohesion: 1.0
Nodes (0): 

### Community 66 - "index.ts"
Cohesion: 1.0
Nodes (0): 

### Community 67 - "businesses.ts"
Cohesion: 1.0
Nodes (0): 

### Community 68 - "contact-requests.ts"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **53 isolated node(s):** `Never Immediately Build Rule`, `Tech Stack (Next.js 15, TS, Postgres, Redis, Prisma, better-auth, Tailwind, Resend)`, `Monorepo Layout (apps/web, packages/db, packages/email, packages/shared, infra, docs)`, `Local Dev Workflow (pnpm + docker compose)`, `Production (Hetzner CAX21)` (+48 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `layout.tsx`** (2 nodes): `layout.tsx`, `DashboardLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `page.tsx`** (2 nodes): `page.tsx`, `AppointmentsPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `page.tsx`** (2 nodes): `page.tsx`, `CustomersPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `page.tsx`** (2 nodes): `page.tsx`, `DebtsPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `page.tsx`** (2 nodes): `page.tsx`, `NotificationsPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `page.tsx`** (2 nodes): `page.tsx`, `TodayPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `layout.tsx`** (2 nodes): `layout.tsx`, `BusinessLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `page.tsx`** (2 nodes): `page.tsx`, `BusinessPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `BottomNav.tsx`** (2 nodes): `BottomNav.tsx`, `BottomNav()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `LogoutButton.tsx`** (2 nodes): `LogoutButton.tsx`, `LogoutButton()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `layout.tsx`** (2 nodes): `layout.tsx`, `RootLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `not-found.tsx`** (2 nodes): `not-found.tsx`, `NotFound()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `page.tsx`** (2 nodes): `page.tsx`, `HomePage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `page.tsx`** (2 nodes): `page.tsx`, `SettingsPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `page.tsx`** (2 nodes): `page.tsx`, `ServicesPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `page.tsx`** (2 nodes): `page.tsx`, `VisibilityPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `page.tsx`** (2 nodes): `page.tsx`, `handleSubmit()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `page.tsx`** (2 nodes): `page.tsx`, `PrivacyPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `page.tsx`** (2 nodes): `page.tsx`, `TermsPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ConfirmDialog.tsx`** (2 nodes): `ConfirmDialog.tsx`, `ConfirmDialog()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `IconButton.tsx`** (2 nodes): `IconButton.tsx`, `IconButton()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Logo.tsx`** (2 nodes): `Logo.tsx`, `Logo()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Modal.tsx`** (2 nodes): `Modal.tsx`, `Modal()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ServiceCard.tsx`** (2 nodes): `ServiceCard.tsx`, `formatDuration()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `About()`** (2 nodes): `About()`, `About.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Features.tsx`** (2 nodes): `Features.tsx`, `Features()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Footer.tsx`** (2 nodes): `Footer.tsx`, `Footer()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `utils.ts`** (2 nodes): `utils.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ContactRequestNotification()`** (2 nodes): `ContactRequestNotification()`, `ContactRequestNotification.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `next-env.d.ts`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `route.ts`** (1 nodes): `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `auth.ts`** (1 nodes): `auth.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `db.ts`** (1 nodes): `db.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `redis.ts`** (1 nodes): `redis.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `index.ts`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `constants.ts`** (1 nodes): `constants.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `services.ts`** (1 nodes): `services.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `tailwind.config.ts`** (1 nodes): `tailwind.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `EmptyState.tsx`** (1 nodes): `EmptyState.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Hero.tsx`** (1 nodes): `Hero.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Showcase.tsx`** (1 nodes): `Showcase.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `button.tsx`** (1 nodes): `button.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `input.tsx`** (1 nodes): `input.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `label.tsx`** (1 nodes): `label.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `switch.tsx`** (1 nodes): `switch.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `textarea.tsx`** (1 nodes): `textarea.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `env.ts`** (1 nodes): `env.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `index.ts`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `businesses.ts`** (1 nodes): `businesses.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `contact-requests.ts`** (1 nodes): `contact-requests.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Phase 1 MVP Codex Task Queue` connect `Phase 1 MVP Task Queue + Dashboard` to `Design System Tokens`, `Vision + Booking Flow`, `Hosting Phases & Layout`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `Handoff #002 — Services Catalog CRUD` connect `Design System Tokens` to `Phase 1 MVP Task Queue + Dashboard`, `Backend Infrastructure`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `Handoff #001 — App Skeleton + DB + Auth + Registration` connect `Phase 1 MVP Task Queue + Dashboard` to `Design System Tokens`, `Vision + Booking Flow`, `Backend Infrastructure`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `Never Immediately Build Rule`, `Tech Stack (Next.js 15, TS, Postgres, Redis, Prisma, better-auth, Tailwind, Resend)`, `Monorepo Layout (apps/web, packages/db, packages/email, packages/shared, infra, docs)` to the rest of the system?**
  _53 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Route Handlers (semantic)` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Phase 1 MVP Task Queue + Dashboard` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Design System Tokens` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._