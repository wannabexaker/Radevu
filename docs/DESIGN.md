# Radevu — Design System

Single source of truth for design tokens, typography, primitives, and motion rules. All code references this file. When `DESIGN.md` and code disagree, code is wrong until proven otherwise.

Three surfaces — **different rules apply to each:**

| Surface | Tone | Animation budget |
|---------|------|------------------|
| **Marketing landing** (`/` at `radevu.gr`) | Expressive, modern, "wow" hero | Allowed: 1-2 framer-motion / aceternity components (gradient bg, spotlight). Lazy-loaded. |
| **Public business profile** (`/<slug>` or `<slug>.radevu.gr`) | Calm, trustworthy, fast | None. Pure CSS transitions only. SSR. The end customer is here to book, not to be entertained. |
| **Owner dashboard** (`/dashboard/*` or `dashboard.radevu.gr`) | Stable, predictable, "pocket secretary" | None. UI must not move between sessions. Stability principle. |

## 1. Color tokens

All values are Tailwind-native — use the class directly, no custom theme keys needed.

| Token | Hex | Tailwind class | Use |
|-------|-----|----------------|-----|
| `brand-primary` | `#6366F1` | `indigo-500` | Primary buttons, links, focus rings, single accent everywhere |
| `brand-primary-hover` | `#4F46E5` | `indigo-600` | Hover state on brand-primary |
| `brand-light` | `#A5B4FC` | `indigo-300` | Subtle highlights, soft badges |
| `brand-gradient-from` | `#60A5FA` | `blue-400` | Hero gradient start (landing only) |
| `brand-gradient-to` | `#A78BFA` | `violet-400` | Hero gradient end (landing only) |
| `bg` | `#FFFFFF` | `white` | Base background |
| `bg-soft` | `#F8FAFC` | `slate-50` | Section alternation |
| `surface` | `#F1F5F9` | `slate-100` | Cards, raised surfaces |
| `border` | `#E2E8F0` | `slate-200` | Dividers, input borders |
| `text-muted` | `#64748B` | `slate-500` | Secondary text, captions |
| `text` | `#1E293B` | `slate-800` | Body text |
| `text-strong` | `#0F172A` | `slate-900` | Headings |
| `success` | `#10B981` | `emerald-500` | Confirmations, "paid" badges |
| `warning` | `#F59E0B` | `amber-500` | Debts pending, attention |
| `error` | `#EF4444` | `red-500` | Validation, destructive actions |

**Rule:** never introduce a color outside this table. If you need one, propose it here first.

## 2. Hero gradient (landing only)

```css
background: linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%);
```

Tailwind: `bg-gradient-to-br from-blue-400 to-violet-400`.

Use only on the landing hero blob/orb behind the H1. Never on buttons (buttons are solid `indigo-500`).

## 3. Typography

**Single font: IBM Plex Sans**, loaded via `next/font/google` (self-hosted by Next, zero external roundtrip, no CLS).

Chosen over Inter because Radevu is Greek-first for an audience of 40+ year old SMB owners (barbers, dentists, teachers, accountants). IBM Plex Sans has humanist Greek letterforms that feel "designed" rather than "default" — warmer than Inter's geometric coldness, while still modern. Full Greek subset, OFL free.

In `apps/web/src/app/layout.tsx`:
```ts
import { IBM_Plex_Sans } from "next/font/google";
const plex = IBM_Plex_Sans({
  subsets: ["latin", "greek"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-plex"
});
```

In `tailwind.config.ts`:
```ts
theme: { extend: { fontFamily: { sans: ["var(--font-plex)", "system-ui", "sans-serif"] } } }
```

### Type scale

| Token | Tailwind | px (mobile) | px (desktop) | Use |
|-------|----------|-------------|--------------|-----|
| `display` | `text-5xl md:text-7xl` | 48 | 72 | Landing hero H1 only |
| `h1` | `text-3xl md:text-4xl` | 30 | 36 | Page titles |
| `h2` | `text-2xl md:text-3xl` | 24 | 30 | Section titles |
| `h3` | `text-xl md:text-2xl` | 20 | 24 | Card titles |
| `body` | `text-base` | 16 | 16 | Default body |
| `small` | `text-sm` | 14 | 14 | Captions, helpers |
| `tiny` | `text-xs` | 12 | 12 | Labels, badges (rare) |

**Weights:** Inter `400` (body), `500` (UI default for buttons / nav), `600` (h2/h3), `700` (h1/display).

**Line-height:** `leading-tight` (1.2) for headings, `leading-relaxed` (1.625) for body paragraphs.

## 4. Spacing & layout

Tailwind defaults. No custom scale.

- **Content padding:** `px-4` mobile, `px-6 md:px-8` larger.
- **Vertical rhythm:** `py-12 md:py-20` for major sections.
- **Card padding:** `p-4 md:p-6`.
- **Gap between stacked items:** `gap-4` default, `gap-6` for cards in a grid.

**Container max-widths:**
- Landing sections: `max-w-6xl mx-auto`
- Public profile: `max-w-md mx-auto` (single phone-width column even on desktop — it's a mobile-app experience)
- Dashboard: `max-w-md mx-auto` (same — phone-shaped on desktop)

## 5. Radius

| Token | Tailwind | Use |
|-------|----------|-----|
| `radius-sm` | `rounded-md` (6px) | Inputs, badges |
| `radius` | `rounded-xl` (12px) | Buttons, cards |
| `radius-lg` | `rounded-2xl` (16px) | Modals, large surfaces |
| `radius-full` | `rounded-full` | Avatars, icon buttons |

## 6. Shadow

| Token | Tailwind | Use |
|-------|----------|-----|
| `shadow-sm` | `shadow-sm` | Subtle elevation on cards |
| `shadow` | `shadow-md` | Modals, popovers |
| `shadow-lg` | `shadow-lg` | Hero floating elements (landing only) |

**Never** use `shadow-xl` or higher in dashboard or public profile — too "designer-toy" for the trust tone.

## 7. Primitives

### Buttons

All buttons ≥44px tall (touch target).

```tsx
// Primary
"inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl font-medium text-white bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"

// Secondary (outline)
"inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl font-medium text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 transition-colors"

// Ghost (no border)
"inline-flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 rounded-xl font-medium text-slate-700 hover:bg-slate-100 transition-colors"

// Destructive
"inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl font-medium text-white bg-red-500 hover:bg-red-600 active:bg-red-700 transition-colors"
```

### Inputs

```tsx
"w-full min-h-[44px] px-3 py-2 rounded-md border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
```

Label always above input. Helper text below in `text-sm text-slate-500`. Error text in `text-sm text-red-500`.

### Cards

```tsx
"rounded-xl border border-slate-200 bg-white p-4 md:p-6"
```

For "elevated" cards (modals, popovers, key dashboard surfaces): add `shadow-sm`.

### Bottom nav (dashboard)

Sticky bottom, 6 equal-width tabs, height 64px (so tap area ≥44px with padding). Active tab: `text-indigo-500` + filled icon. Inactive: `text-slate-500` + outline icon.

Content area: `pb-20` to clear the nav.

## 8. Iconography

**Library:** `lucide-react`. Tree-shakeable, ~5KB per icon used.

**Dashboard tab icons (locked):**

| Tab | Icon |
|-----|------|
| Today | `CalendarDays` |
| Appointments | `ListChecks` |
| Customers | `Users` |
| Debts | `Wallet` |
| Notifications | `Bell` |
| Settings | `Settings` |

**Action icons:**

| Action | Icon |
|--------|------|
| Add / new | `Plus` |
| Edit | `Pencil` |
| Delete | `Trash2` |
| Confirm done | `Check` |
| Cancel / close | `X` |
| Next / forward | `ChevronRight` |
| Back | `ChevronLeft` |
| Time | `Clock` |
| Phone | `Phone` |
| Email | `Mail` |
| Location | `MapPin` |
| External link | `ExternalLink` |

Icon size: `w-5 h-5` default (20px), `w-4 h-4` in tight UI, `w-6 h-6` in nav.

## 9. Motion budget

**Default: zero motion.** Add only when it serves clarity, never decoration.

| Surface | Allowed |
|---------|---------|
| Landing hero | 1-2 framer-motion / aceternity components. Lazy-loaded with `next/dynamic` so they don't ship to the dashboard bundle. Max: one ambient background (gradient blob) + one entrance animation on H1 + sub. |
| Public profile | Pure CSS `transition-colors` (150ms) on buttons. No JS animation libraries. |
| Dashboard | Pure CSS `transition-colors` (150ms). No JS animation libraries. No page transitions. |

**Forbidden everywhere:** scroll-jacking, parallax beyond hero, mouse-tracking effects on touch surfaces, auto-playing carousels.

## 10. Voice & tone (Greek copy)

- **Address:** εσύ (informal). Warmth > formality. Even towards business owners.
- **No marketing buzzwords.** No "revolutionary", no "powerful", no "supercharge". Calm and concrete.
- **Verbs > nouns.** "Κράτησε ραντεβού" > "Πραγματοποιήστε κράτηση ραντεβού".
- **Short sentences.** Max 12-15 words. Read like a friend explaining, not a brochure.
- **No emoji** in product UI. Optional sparingly in marketing landing.
- **Numbers always in Greek conventions** (24 ώρες, 2 λεπτά). Currency as `€10` not `10 €`.

### Critical: "ραντεβού" is ambiguous in Greek

The word **ραντεβού** alone reads as either "professional appointment" OR "romantic date" depending on context. Radevu is a **professional appointments platform** — every use of "ραντεβού" must be anchored so it cannot be misread as dating.

**✅ Correct (anchored, professional):**
- "online ραντεβού για μικρές επιχειρήσεις" (context: businesses)
- "ραντεβού για [υπηρεσία]" — "ραντεβού για κούρεμα", "ραντεβού για καθαρισμό"
- "ραντεβού στο [business name]" — "ραντεβού στο Κουρείο Γιάννης"
- "3 ραντεβού σήμερα" (calendar/count context)
- "Επόμενο ραντεβού: Τρίτη 10:00 — Καθαρισμός" (scheduled context)
- "Κράτησε ραντεβού" (verb-led action, context implied by surrounding UI)

**❌ Forbidden (ambiguous or romantic-sounding):**
- "Έχεις ραντεβού!" — reads as "You have a date!" out of context
- "Θέλεις ραντεβού;" — sounds like asking someone out
- "Το ραντεβού σου σε περιμένει" — overly intimate phrasing
- "Νέο ραντεβού" without service/customer name — vague
- Any heart emojis (❤️ 💕 💑), wedding/champagne imagery, "ρομαντικό", "γνωριμία", "συνάντηση" (alone)

### Preferred vocabulary

| Concept | Use this | Avoid |
|---------|----------|-------|
| The booking act | **κράτηση** | "ραντεβού" alone |
| The scheduled appointment | **ραντεβού + service/business name** | "ραντεβού" alone |
| Confirmation | "Έγινε η κράτηση" / "Επιβεβαίωση κράτησης" | "Έχεις ραντεβού" |
| Reminder | "Υπενθύμιση: ραντεβού για [service] αύριο στις [time]" | "Σου θυμίζω το ραντεβού" |
| The customer | **πελάτης / πελάτισσα** | "καλεσμένος", "συνομιλητής" |
| The business | **επιχείρηση / επαγγελματίας** | "συνεργάτης" (too vague) |
| Cancel | **ακύρωση κράτησης** | "ακύρωση" alone |

### Email subject patterns (mandatory)

| Email | Subject template |
|-------|------------------|
| BookingConfirmation (customer) | `Επιβεβαίωση κράτησης — {service_name} στις {business_name}` |
| OwnerNewBookingAlert | `Νέα κράτηση — {customer_name} για {service_name}` |
| BookingReminder (chunk #8) | `Υπενθύμιση: αύριο {formatted_time} — {service_name} στις {business_name}` |

Every email subject must contain BOTH the service name AND the business name — that's what guarantees the recipient sees "professional context" at a glance in their inbox, not a dating ping.

### Greeting + closing in emails

- Greeting: `Γεια σου {customer_name},` (informal, warm, no "Αγαπητέ/ή")
- Closing: `— Η ομάδα του Radevu` (collective, neutral)
- Footer line: `Radevu — online ραντεβού για επαγγελματίες.` (anchors brand context)

### Audit rule (every chunk)

Before submitting any chunk that adds or changes Greek copy, grep the diff for the literal word `ραντεβού` and verify each occurrence is anchored per the rules above. If unsure, replace with `κράτηση` or add the service/business name.

## 11. Component libraries policy

| Library | Use? | Where |
|---------|------|-------|
| Tailwind CSS | ✅ Required | Everywhere |
| lucide-react | ✅ Required | Everywhere |
| clsx + tailwind-merge | ✅ Required | Everywhere (the `cn()` utility) |
| **shadcn-style primitives** (Button, Input, Textarea, Label, etc.) | ✅ Required | Manually copy-pasted into `src/components/ui/`. Tailwind theme uses CSS variables (`--primary`, `--muted`) that map to our indigo palette so shadcn-style `bg-primary` works natively. We do NOT run `npx shadcn init` — manual copy for ownership + Greek-friendly tweaks. |
| class-variance-authority (cva) | ✅ Required | Variant system for the shadcn primitives. |
| @radix-ui/react-slot | ✅ Required | Needed by shadcn Button's `asChild` pattern. |
| @radix-ui/react-* (other primitives) | ✅ Selective | Only when needed for accessibility (Dialog, Dropdown, Popover, Switch). One primitive at a time, added per chunk. |
| framer-motion | ✅ Selective | **Landing page ONLY**, lazy-loaded with `next/dynamic`. Forbidden in dashboard / public profile bundles. |
| aceternity-ui | ✅ Selective | **Landing page ONLY**, max 2 components. Manual copy. |
| shadcn-ui CLI / npm package | ❌ | We use the patterns + primitives, not the CLI. Avoids over-coupling. |
| Material UI / Chakra / Mantine | ❌ | Conflicts with Tailwind, breaks the stability/calm tone. |
| react-hook-form | ✅ When forms have >4 fields | Phase 1 forms (registration, service create) use plain React state. Add `react-hook-form` when we hit a complex form (e.g., business settings with 15 fields). |
| @playwright/test | ✅ devDependency only | Required for e2e tests (booking-flow.spec.ts and future flows). Never imported in runtime code. Multi-stage Dockerfile already excludes devDependencies in the runtime stage. |
| vitest | ✅ devDependency only | Same rule — unit tests only. Already configured. |

**Rule:** every new library addition must update this section + be justified in the Codex handoff's "Dependencies added" list.

## 12. Landing page composition (radevu.gr root)

The landing page is the ONE surface where expressive motion + richer composition is allowed. It still respects the calm/trust tone — no flashy "design agency" energy.

### Sections (locked)

1. **Header** — sticky, transparent over hero, solid on scroll. Logo left, minimal nav center (About · Features · Contact), small "Σύνδεση" link right. NO "Get Started / Register" CTA in header — manual onboarding philosophy.
2. **Hero** — text + image grid. Headline + sub + ONE primary CTA "Επικοινώνησε μαζί μου" → scroll to contact. Soft gradient blob (indigo/violet) behind image.
3. **About Radevu** — short story of the product. Two paragraphs max.
4. **Features 6-grid** — six cards explaining what Radevu does (NOT "what we offer as a design agency"):
   - Online ραντεβού · Ιστορικό πελατών · Email + .ics · Mobile-first · ≤2 taps · Δωρεάν στο beta
5. **Businesses on Radevu** — opt-in logo wall. Each business has `show_on_landing` flag (default false). Only opted-in businesses appear. Empty state: "Σύντομα — οι πρώτοι επαγγελματίες που μπαίνουν στο Radevu." No search, no filter, no links to public profiles — just logos.
6. **Contact** — primary acquisition channel. Form: name, email, phone, message. POST → email to founder via Resend.
7. **Footer** — 3 cols (About / Νομικά / Επικοινωνία). NO newsletter subscribe. Copyright line.

### Forbidden on landing (out of scope by vision)

- Self-serve registration CTA (manual onboarding philosophy)
- Marketplace / directory / search of businesses
- Testimonials carousel (we'll add when we have 3-5 real testimonials, not before)
- Portfolio bento (we don't showcase business work)
- Newsletter subscribe (off-tone)
- Pricing page (free in beta, no pricing to show)

### Motion budget on landing

- 1 ambient gradient blob (CSS animation, no JS) behind hero image
- Entrance fade-up on H1 + sub (framer-motion, lazy-loaded)
- Hover lift on feature cards (CSS transform, no JS)
- Mobile menu slide-in (framer-motion)
- **Nothing else.** No scroll-jacking, no parallax, no mouse-tracking, no cursor effects.

## 13. Verticals for Phase 2 templates

Locked list of professions Radevu will support with pre-built service templates + tap-action menus in Phase 2. Phase 1 stays generic (any service: name + duration + price).

1. **Κουρέας / Κομμωτήριο** — haircuts, beard, color, treatment. Most universal, best for first demos.
2. **Δασκάλα Αγγλικών** — private English lessons. Recurring slots.
3. **Καθηγήτρια Φιλόλογος** — Greek literature tutoring. Recurring + exam prep blocks.
4. **Καφετέρια — HR interviews** — cafe owner scheduling staff candidates. **Interesting case: this expands the product narrative from "service businesses" to "anyone with slot-based scheduling needs." Worth keeping in mind for vision evolution.**
5. **Τεχνικός δικτύων** — on-site network technician service calls.
6. **Οδοντίατρος** — cleaning, filling, root canal, x-ray. Follow-up suggestions per visit.
7. **Λογιστής** — tax appointments, monthly check-ins.

**Phase 1 demo seed** uses ONE of these (TBD by founder) to populate the dev DB with realistic content for screenshots + manual QA.

## 13. Accessibility minimums

- Color contrast: WCAG AA. Text on white must be `text-slate-700` or darker. Text on `indigo-500` must be white.
- Focus rings: visible on every interactive element. Use `focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`.
- Tap targets: ≥44×44px everywhere on mobile.
- Form labels: always present, never relying on placeholder alone.
- Errors: never color-only — always paired with an icon + text.
- Greek `lang="el"` on `<html>`.
- Viewport meta: `user-scalable=no` is set (per skill), but text must still be readable without zoom — base body 16px minimum.
