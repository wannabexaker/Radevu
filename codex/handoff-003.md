# Codex Handoff #003 — Landing page + shadcn primitives + showcase opt-in

> **Codex CLI usage:** `cd C:\Projects\Radevu && codex` then paste this file as your task.
>
> **Prerequisite:** Chunk #2 (services CRUD) must be merged first — this chunk depends on `cn()` utility and the Settings tab structure from chunk #2.

## Your role

Same as previous chunks. Read your system prompt at `C:\Users\Jiannis\.claude\skills\booking-saas-codex-context\SKILL.md`. Follow it strictly: output format (§6), code style (§4), never-do list (§5).

Also load:
- `C:\Users\Jiannis\.claude\skills\booking-saas-project\SKILL.md`
- `C:\Projects\Radevu\docs\DESIGN.md` (especially §11 library policy, §12 landing composition)
- `C:\Projects\Radevu\docs\API.md`

## Task

Build the Radevu marketing landing page at `/` (root). Adopt shadcn-style primitives. Add the businesses-showcase opt-in feature end-to-end.

## Goal (testable outcome)

After this handoff:

1. Browse to `http://localhost:3000/` → sees a polished landing page in Greek with: sticky header, hero (text + image + gradient blob), about, 6-feature grid, businesses showcase (empty state for now), contact form, footer.
2. Mobile menu (≤md) opens/closes with slide animation; nav links scroll to sections.
3. Filling the contact form with valid data → POST `/api/v1/contact-requests` → server sends email via Resend to `CONTACT_NOTIFICATION_EMAIL` → confirmation message shown to user.
4. Owner logs into dashboard → Settings → sees a new entry "Εμφάνιση στο landing" → toggle ON → flag saved → re-load landing → THE business now appears in the showcase grid (logo + name).
5. Toggle OFF → business disappears from landing.
6. All animations are smooth at 360×800. Page Lighthouse mobile ≥85 performance.
7. `pnpm -r typecheck` passes. `pnpm --filter @radevu/web build` produces a clean standalone bundle.
8. framer-motion is lazy-loaded — verify it does NOT appear in the dashboard's first-load JS (check Next.js build output bundle analyzer).

## What's already in the repo — do NOT modify

Everything from chunks #1 and #2. You build on top. Specifically do NOT touch:
- `apps/web/Dockerfile`
- `infra/*`
- `.github/workflows/build-and-push.yml`
- The 6 dashboard tab pages (you'll only ADD a new sub-route under Settings)

## Files you MUST create or modify

### Tailwind theme setup (shadcn CSS variables)

- **MODIFY** `apps/web/tailwind.config.ts` — add theme.extend.colors with shadcn-style HSL CSS variables. Add `theme.extend.borderRadius` for `--radius`. Add `theme.extend.keyframes` and `animation` for `accordion-down/up` and a slow gradient drift `blob`.
- **MODIFY** `apps/web/src/app/globals.css` — add `:root` block with CSS variables:
  - `--background: 0 0% 100%`
  - `--foreground: 222 47% 11%`
  - `--primary: 239 84% 67%` (indigo-500)
  - `--primary-foreground: 0 0% 100%`
  - `--muted: 210 40% 96%`
  - `--muted-foreground: 215 16% 47%`
  - `--accent: 210 40% 96%`
  - `--border: 214 32% 91%`
  - `--input: 214 32% 91%`
  - `--ring: 239 84% 67%`
  - `--radius: 0.75rem`
- Add the IBM Plex Sans font via `next/font/google` in `apps/web/src/app/layout.tsx` if not already (chunk #1 used a different one — replace with Plex per DESIGN.md §3).

### shadcn primitives (manually copy-pasted, adapted to Radevu)

- `apps/web/src/components/ui/button.tsx` — the shadcn Button verbatim (uses cva, Radix Slot for `asChild`). Variants: default, destructive, outline, secondary, ghost, link. Sizes: default (h-11), sm (h-10), lg (h-12), icon (h-11 w-11). **Minimum height 44px** for default/lg/icon (touch target compliance — override shadcn's defaults).
- `apps/web/src/components/ui/input.tsx` — shadcn Input. Override `h-10` → `h-11` for touch target.
- `apps/web/src/components/ui/textarea.tsx` — shadcn Textarea. Min-height `min-h-[120px]`.
- `apps/web/src/components/ui/label.tsx` — minimal label component (Radix Label or hand-rolled).
- `apps/web/src/lib/utils.ts` — rename of `cn.ts` from chunk #2 (or create if chunk #2 used `cn.ts`). Standard shadcn `cn()` helper.
- **DELETE** the old `apps/web/src/components/SubmitButton.tsx` and `apps/web/src/components/Input.tsx` from chunk #1 (replaced by `ui/button` and `ui/input`).
- **UPDATE** every existing import that used the deleted components — point them to `@/components/ui/button` / `@/components/ui/input` with appropriate variant.

### Logo component (PNG provided by founder)

- `apps/web/src/components/Logo.tsx` — renders the founder's PNG at `apps/web/public/radevu.png` using `next/image`. Props: `<Logo size="sm|md|lg" />` (defaults md = 40px). Optional prop `shape="square|triangle"` (default square). When `shape="triangle"`, apply Tailwind `[clip-path:polygon(50%_0%,0%_100%,100%_100%)]` to the image wrapper for a pyramid silhouette — the founder is evaluating this differentiation choice.
- Image dimensions: pass `width={size}` `height={size}` based on the size prop. Add `priority` only in the header use. Use `alt="Radevu"`.
- If `radevu.png` is missing (404 from next/image), the component falls back to typography "radevu" in `font-semibold tracking-tight` with the indigo→violet gradient via `bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400`.
- Two consumption sites: header (size="md"), footer (size="sm"). No icon-only variant for now — the founder's PNG is a single mark.

### Landing page sections (all `apps/web/src/components/landing/*`)

- `apps/web/src/components/landing/Header.tsx` — sticky, transparent over hero, solid white on scroll (CSS `position: sticky` + scroll detection hook). Logo left, desktop nav center (About · Features · Contact), small "Σύνδεση" link right pointing to `/dashboard/login`. Mobile: hamburger → full-screen menu drawer with framer-motion slide-in.
- `apps/web/src/components/landing/Hero.tsx` — text + image grid (lg:grid-cols-[1fr_500px]). H1 + sub + primary CTA "Επικοινώνησε μαζί μου" (button variant=default, scrolls to `#contact`). Gradient blob behind image (pure CSS animated, no JS). Entrance animations via framer-motion (fade-up on H1 then sub then CTA, staggered).
- `apps/web/src/components/landing/About.tsx` — two paragraphs about Radevu's story (Greek). No image.
- `apps/web/src/components/landing/Features.tsx` — 6-card grid (sm:grid-cols-2 lg:grid-cols-3). Each card: lucide icon (24px, indigo-500), title, 2-line description, no hover effects beyond `hover:shadow-md`.
- `apps/web/src/components/landing/Showcase.tsx` — server component. Queries Prisma for businesses where `showOnLanding=true`. Renders grid of logo cards. If zero results: empty state ("Σύντομα — οι πρώτοι επαγγελματίες που μπαίνουν στο Radevu" + neutral icon).
- `apps/web/src/components/landing/Contact.tsx` — form with 4 fields (name, email, phone, message). Plain React state. POSTs to `/api/v1/contact-requests`. Success → green confirmation message; error → red inline.
- `apps/web/src/components/landing/Footer.tsx` — 3 cols (Radevu / Νομικά / Επικοινωνία). Copyright line bottom.
- `apps/web/src/components/landing/MotionWrapper.tsx` — wraps client components that use framer-motion. Use `next/dynamic` with `{ ssr: false }` for components that animate, so framer-motion is only loaded when this wrapper appears.

### Pages

- **MODIFY** `apps/web/src/app/page.tsx` — replace the chunk #1 placeholder with a full landing assembly: `<Header /> <main> <Hero /> <About /> <Features /> <Showcase /> <Contact /> </main> <Footer />`.
- **CREATE** `apps/web/src/app/(protected-dashboard)/dashboard/settings/visibility/page.tsx` — new sub-route. Server component fetches owner's business, renders a switch (Radix Switch primitive) for `show_on_landing`. Tap → POST → DB update → router.refresh.
- **MODIFY** `apps/web/src/app/(protected-dashboard)/dashboard/settings/page.tsx` — add new menu entry "Εμφάνιση στο landing" linking to `/dashboard/settings/visibility`, below the existing "Υπηρεσίες" entry.

### API

- `apps/web/src/app/api/v1/contact-requests/route.ts` — POST only. Validates body with new zod schema. Sends email via Resend (use `resend` SDK). Returns `201 { ok: true }` or 500 on Resend failure (logged but doesn't leak details to client).
- `apps/web/src/app/api/v1/businesses/[id]/visibility/route.ts` — PATCH only. Owner-only. Toggles `show_on_landing`. Returns `200 { business: { id, show_on_landing } }`.

### Shared

- `packages/shared/src/api/contact-requests.ts` — zod schema (name 2-100, email valid, phone optional 5-20, message 10-2000).
- `packages/shared/src/api/businesses.ts` — extend with `updateVisibilitySchema` (`show_on_landing: z.boolean()`).
- `packages/shared/src/index.ts` — re-export new schemas.

### Database

- **MODIFY** `packages/db/prisma/schema.prisma` — add `showOnLanding Boolean @default(false) @map("show_on_landing")` to Business model.
- Run `pnpm --filter @radevu/db migrate:dev --name add_business_show_on_landing` to generate migration. Commit the migration file.

### Email template

- `packages/email/src/templates/ContactRequestNotification.tsx` — React Email template for the contact form. Sent to founder. Subject: "Νέο contact request — {name}". Body: shows name, email, phone, message. Plain professional, no marketing styling.
- `packages/email/src/index.ts` — exports `sendContactRequestEmail({ name, email, phone, message }): Promise<void>`. Uses Resend SDK. Reads `CONTACT_NOTIFICATION_EMAIL` and `RESEND_FROM_EMAIL` from env (validate via the same env loader pattern as `apps/web`).
- `packages/email/package.json` — add deps: `resend@^4.0.1`, `@react-email/components@^0.0.28`, `react@^18.3.1`.

### Env

- **MODIFY** `infra/.env.example` — add `CONTACT_NOTIFICATION_EMAIL=` (the founder's email).
- **MODIFY** `apps/web/src/lib/env.ts` — add `CONTACT_NOTIFICATION_EMAIL` to schema, required in prod.

## Hero copy (locked: Variant B)

```
H1: Online ραντεβού για μικρές επιχειρήσεις.
Sub: Δώσε στους πελάτες σου ένα link. Κρατάνε μόνοι τους, εσύ βλέπεις τη μέρα σου από το κινητό. Χωρίς χαρτιά, χωρίς τηλέφωνα.
CTA: Επικοινώνησε μαζί μου  (scrolls to #contact)
```

## About copy (Greek)

```
Παράγραφος 1:
Το Radevu φτιάχτηκε για επαγγελματίες που δεν θέλουν να μάθουν software. Κουρείς, οδοντίατροι, δασκάλες, λογιστές, τεχνικοί — άνθρωποι που έχουν κουραστεί να χάνουν χρόνο σε τηλέφωνα και χαρτάκια. Σου δίνει μια απλή ψηφιακή γραμματεία τσέπης, χωρίς εκπτώσεις στο ποιοτικό αποτέλεσμα.

Παράγραφος 2:
Είναι φτιαγμένο τοπικά, στην Ελλάδα. Δεν είσαι νούμερο σε ένα enterprise platform — αν χρειαστείς βοήθεια, μιλάς με τον άνθρωπο που το έφτιαξε. Στο beta είναι δωρεάν για όλους — γιατί ο στόχος είναι να αποδειχθεί ότι λειτουργεί στην πράξη, όχι να εισπράξει.
```

## Features grid copy

Six cards (icon + title + 2-line description). Use lucide icons:

1. `Globe` — **Online ραντεβού** — Δώσε ένα link, ο πελάτης κλείνει σε 60 δευτερόλεπτα από το κινητό.
2. `Users` — **Ιστορικό πελατών** — Δες σε ένα tap τι έχει κάνει ο κάθε πελάτης, τι ζήτησε, τι χρωστάει.
3. `Mail` — **Email + ημερολόγιο** — Κάθε κράτηση έρχεται με επιβεβαίωση και calendar invite (.ics) στον πελάτη.
4. `Smartphone` — **Mobile-first** — Σχεδιασμένο σαν εφαρμογή στο κινητό σου, όχι σαν responsive site.
5. `Zap` — **≤2 taps** — Από κάθε οθόνη φτάνεις σε κάθε ενέργεια σε δύο πατήματα ή λιγότερα.
6. `Heart` — **Δωρεάν στο beta** — Χρησιμοποίησέ το ελεύθερα όσο είμαστε στο beta. Καμία χρέωση, καμία κάρτα.

## Footer copy (Greek)

Three columns:

**Radevu**
- Σχετικά
- Επικοινωνία

**Νομικά**
- Όροι χρήσης (placeholder route `/legal/terms`, page returns "Σύντομα")
- Πολιτική απορρήτου (`/legal/privacy`, "Σύντομα")

**Επικοινωνία**
- (founder email, rendered from `CONTACT_NOTIFICATION_EMAIL` server-side and shown as `<a href="mailto:...">`)

Copyright line: `© 2026 Radevu. Φτιαγμένο στην Ελλάδα.`

## Dependencies to add

Add to `apps/web/package.json`:

```json
{
  "dependencies": {
    "framer-motion": "^11.11.17",
    "class-variance-authority": "^0.7.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-switch": "^1.1.1"
  }
}
```

Add to `packages/email/package.json`:

```json
{
  "dependencies": {
    "resend": "^4.0.1",
    "@react-email/components": "^0.0.28",
    "react": "^18.3.1"
  }
}
```

No other deps.

## Lazy-loading rule for framer-motion

framer-motion is heavy (~50KB gzipped) and should NEVER ship in the dashboard or public profile bundles. Pattern:

```tsx
// apps/web/src/components/landing/Hero.tsx
"use client";
import dynamic from "next/dynamic";
const MotionDiv = dynamic(() => import("framer-motion").then(m => ({ default: m.motion.div })), { ssr: false });
```

Or wrap motion components in a `MotionWrapper.tsx` that's itself `next/dynamic`-loaded.

Verify via `pnpm --filter @radevu/web build` output: the route `/dashboard/today` should have zero framer-motion in its bundle.

## Acceptance criteria

```bash
pnpm install
pnpm --filter @radevu/db migrate:dev --name add_business_show_on_landing
pnpm -r typecheck
pnpm --filter @radevu/web build
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d --build web
sleep 30
curl -s http://localhost:3000/api/health        # 200 ok still
```

Browser at 360×800:
- `/` → landing renders, smooth animations, all sections visible by scroll
- Tap hero CTA → smooth-scrolls to contact section
- Fill contact form with valid data + submit → success message + founder receives email (check inbox or Resend dashboard)
- Mobile menu opens, links work, closes
- Log in (chunk #1 owner), navigate Settings → Εμφάνιση στο landing → toggle ON → re-load `/` → THE business appears in showcase grid
- Toggle OFF → business disappears
- `curl 'http://localhost:3000/?'` shows businesses in HTML (SSR works)
- Lighthouse mobile: Performance ≥85, Accessibility ≥95

## Hard rules (do not violate)

- TypeScript strict. No `any` without justification.
- Tailwind only + the new shadcn primitives (in `src/components/ui/`). No inline styles. No CSS modules.
- Mobile-first 360×800. Tap targets ≥44px. Sticky header doesn't occlude content.
- Use design tokens from DESIGN.md. Use shadcn CSS variables. Do not invent colors.
- JSDoc on every exported function from `lib/`, `packages/`, and the email module.
- Explicit error handling. Contact form failures log server-side details but show generic "Δοκίμασε ξανά" to user.
- Snake_case JSON keys in request/response bodies.
- Never hardcode `radevu.gr` or any TLD. The footer email reads from `CONTACT_NOTIFICATION_EMAIL` env.
- No new npm packages beyond the listed set.
- No placeholder code or TODO comments. The "Σύντομα" legal pages ARE the deliverable for now — they render the word "Σύντομα" centered. Documented as intentional.
- framer-motion must be lazy-loaded — fail the chunk if it appears in non-landing routes' bundles.

## Output format

Per `booking-saas-codex-context` skill §6: `## File:` blocks, then `## Dependencies added`, then `## Files that need updating due to this change`. Self-check before returning.
