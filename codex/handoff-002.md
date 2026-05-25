# Codex Handoff #002 — Services catalog CRUD

> **Codex CLI usage:** `cd C:\Projects\Radevu && codex` then paste this file as your task.

## Your role

Same as handoff-001. Read your system prompt at `C:\Users\Jiannis\.claude\skills\booking-saas-codex-context\SKILL.md`. Follow it strictly for output format (§6), code style (§4), never-do list (§5), self-check.

Also load:
- `C:\Users\Jiannis\.claude\skills\booking-saas-project\SKILL.md` (project spec)
- `C:\Projects\Radevu\docs\DESIGN.md` (design tokens — strict source of truth for tokens, primitives, library policy)
- `C:\Projects\Radevu\docs\API.md` (route contracts)

## Task

Implement **TASK-007** from `docs/CODEX_TASKS.md` — service catalog CRUD.

## Goal (testable outcome)

After this handoff:

1. Owner logs in (from chunk #1), navigates to **Settings → Services**.
2. Empty state: sees "Δεν έχεις υπηρεσίες ακόμα" with a primary CTA "+ Νέα υπηρεσία".
3. Taps CTA → accessible modal (Radix Dialog) opens with form: name, duration (minutes), price (euros, displayed as € but stored as cents), description (optional).
4. Fills + submits → service appears in the list as a card showing name, duration, price, active toggle, edit + delete icon buttons.
5. Taps **edit** icon → modal reopens with pre-filled values → can change → saves.
6. Taps active toggle → service shows muted (opacity reduced + "Ανενεργή" label) but stays in list.
7. Taps **delete** icon → confirm dialog → on confirm, service removed.
8. Public API: `GET /api/v1/businesses/:id/services?active=true` returns only active services. Without `?active=true`, owner sees all (including inactive).
9. All UI at 360×800: no horizontal scroll, tap targets ≥44px, sticky bottom nav clears with `pb-20`.
10. `pnpm -r typecheck` passes.

## What's already in the repo — do NOT modify

- All files from handoff-001 are wired correctly. Build on top of them.
- `apps/web/src/app/(protected-dashboard)/dashboard/settings/page.tsx` — placeholder. **You will replace this** to link to the new services sub-route.
- Everything else from handoff-001 stays as-is unless explicitly listed below.

## Files to create or modify

### Modify

- `apps/web/src/app/(protected-dashboard)/dashboard/settings/page.tsx` — replace placeholder with a settings menu listing sub-sections. For now, only one entry: "Υπηρεσίες" linking to `/dashboard/settings/services`. Use a vertical list of tappable rows (≥44px), `ChevronRight` icon on the right.
- `packages/shared/src/index.ts` — re-export the new `services` API schemas.
- `apps/web/package.json` — add the 4 new dependencies (specified below).

### Create

#### Shared
- `packages/shared/src/api/services.ts` — zod schemas:
  - `createServiceSchema` — `name` (2-80), `duration_minutes` (5-720), `price_cents` (0-1_000_000), `description` (optional, max 500)
  - `updateServiceSchema` — partial of create + `active` (boolean)
  - `serviceQuerySchema` — `active` (boolean coerced from string)
  - Export inferred types.

#### Utilities
- `apps/web/src/lib/cn.ts` — the `cn()` utility (`clsx` + `tailwind-merge`).
- `apps/web/src/lib/format.ts` — pure helpers:
  - `formatPrice(cents: number, currency = "EUR"): string` — e.g., `1500` → `"€15,00"` using `Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR" })`
  - `formatDuration(minutes: number): string` — `30` → `"30 λεπτά"`, `90` → `"1ώ 30λ"`, `120` → `"2 ώρες"`

#### Components (mobile-first, design tokens from DESIGN.md)
- `apps/web/src/components/Modal.tsx` — Radix Dialog wrapper with:
  - Overlay: `fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40`
  - Content: `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,440px)] max-h-[90vh] overflow-auto bg-white rounded-2xl shadow-md p-6 z-50`
  - Title + close button (X) in header.
  - Props: `open`, `onOpenChange`, `title`, `children`.
- `apps/web/src/components/IconButton.tsx` — square 44×44 button wrapping a lucide icon. Variants: `default` (ghost), `danger` (red on hover).
- `apps/web/src/components/ServiceCard.tsx` — single service row. Shows name, formatted price, formatted duration. Edit + delete icon buttons. Active toggle as a small Radix Switch OR a simple button. When inactive: `opacity-60` + "Ανενεργή" muted badge.
- `apps/web/src/components/ServiceForm.tsx` — form inside the modal. 4 fields. Plain React state (no react-hook-form — not justified for 4 fields). Validates with `createServiceSchema` / `updateServiceSchema` on submit. Shows inline errors.
- `apps/web/src/components/ConfirmDialog.tsx` — small modal: title, body, "Άκυρο" / "Διαγραφή" buttons. Uses Modal wrapper.
- `apps/web/src/components/EmptyState.tsx` — generic empty state: icon, title, optional description, optional CTA. Centered, vertical.

#### Pages
- `apps/web/src/app/(protected-dashboard)/dashboard/settings/services/page.tsx` — server component. Fetches owner's business + services via Prisma. Renders client component below with initial data.
- `apps/web/src/app/(protected-dashboard)/dashboard/settings/services/ServicesClient.tsx` — client component. Manages modal state, optimistic updates via `router.refresh()` after successful mutations. Lists services using `ServiceCard`. Floating "+ Νέα υπηρεσία" button at bottom-right (z-index above bottom nav, e.g., `fixed bottom-24 right-4`).

#### API routes
- `apps/web/src/app/api/v1/businesses/[id]/services/route.ts`:
  - `GET` — public + owner. Query param `active` (boolean). If owner: returns all; if public: returns only active (force `active=true` when no session for that business).
  - `POST` — owner-only. Validates body with `createServiceSchema`. Creates Service tied to business. Returns 201 with service.
- `apps/web/src/app/api/v1/services/[id]/route.ts`:
  - `PATCH` — owner-only. Validates with `updateServiceSchema`. Updates allowed fields. Returns 200.
  - `DELETE` — owner-only. Hard delete (cascade rules per schema). Returns 204.

All error responses follow the standard shape: `{ error: { code, message, details? } }`.

## Dependencies to add

Add to `apps/web/package.json`:

```json
{
  "dependencies": {
    "lucide-react": "^0.460.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4",
    "@radix-ui/react-dialog": "^1.1.2"
  }
}
```

No other deps. If you genuinely need one, stop and ask.

## Auth pattern (reuse from chunk #1)

Server-side auth check pattern (use this consistently in API routes and server components):

```ts
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireOwner(businessId: string) {
  const session = await auth.api.getSession({ headers: headers() });
  if (!session) {
    return { ok: false as const, status: 401, code: "UNAUTHENTICATED" };
  }
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { ownerId: true }
  });
  if (!business) {
    return { ok: false as const, status: 404, code: "NOT_FOUND" };
  }
  if (business.ownerId !== session.user.id) {
    return { ok: false as const, status: 403, code: "FORBIDDEN" };
  }
  return { ok: true as const, session, business };
}
```

For `/api/v1/services/[id]` PATCH/DELETE: look up the service first, find its `businessId`, then call `requireOwner(businessId)`.

## Design tokens (from DESIGN.md — do NOT invent new tokens)

- Primary button: `inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl font-medium text-white bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 disabled:bg-slate-300 transition-colors`
- Card: `rounded-xl border border-slate-200 bg-white p-4`
- Input: `w-full min-h-[44px] px-3 py-2 rounded-md border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent`
- Icons via `lucide-react`. Settings sub-link icon: `Settings2`. Edit: `Pencil`. Delete: `Trash2`. Add: `Plus`. Chevron: `ChevronRight`. Close: `X`. Empty state: `Briefcase`.
- Floating add button: `fixed bottom-24 right-4 w-14 h-14 rounded-full bg-indigo-500 text-white shadow-lg flex items-center justify-center` — icon `Plus` 24px.

## Acceptance criteria

Run all of these:

```bash
pnpm install
pnpm -r typecheck                  # zero errors
pnpm --filter @radevu/web build    # builds standalone
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d --build web
sleep 30
curl -s http://localhost:3000/api/health    # still 200 ok
```

Browser at 360×800 (DevTools device emulation):
- Log in with the user created in chunk #1 (`test-shop` business).
- Navigate `/dashboard/settings` → see "Υπηρεσίες" row → tap → arrive at `/dashboard/settings/services`.
- Empty state shows. Tap "+ Νέα υπηρεσία".
- Fill: name "Ανδρικό κούρεμα", duration 30, price 15, description "Σαμπουάν + κούρεμα". Submit → modal closes, service appears.
- Tap edit on the service → modal pre-filled → change price to 18 → save → reflects.
- Tap active toggle → service shows muted with "Ανενεργή".
- Tap toggle again → active.
- Tap delete → confirm → service removed, empty state returns.
- `curl http://localhost:3000/api/v1/businesses/<business_id>/services?active=true` returns the active services as JSON.

API contract validation:
- POST without auth → 401
- POST with auth but wrong business owner → 403
- POST with invalid body → 400 with `code: "VALIDATION_ERROR"` and field-level details
- PATCH/DELETE on a service not owned by session → 403

## Hard rules (do not violate)

- TypeScript strict. No `any` without justification comment.
- Tailwind utility classes only — no inline styles, no CSS modules.
- Mobile-first at 360×800. Tap targets ≥44px. Floating button clears bottom nav (`bottom-24`).
- Use design tokens from `docs/DESIGN.md`. Do not invent colors, radii, shadows.
- JSDoc on every exported function from `lib/` and `packages/`.
- Explicit error handling. No silent catches.
- API routes return `{ error: { code, message } }` on failure.
- Snake_case JSON keys in request/response bodies. camelCase Prisma fields with `@map`.
- Never hardcode TLD or routing mode. Read from env via `@/lib/env`.
- No new npm packages beyond the 4 listed.
- No placeholder code or TODO comments. The page is the deliverable.

## Output format

Per `booking-saas-codex-context` skill §6:
- `## File: <relative/path>` block per file with complete content.
- Trailing `## Dependencies added` section.
- Trailing `## Files that need updating due to this change` section.
- Self-check before returning.
