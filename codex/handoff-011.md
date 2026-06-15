# Codex Handoff #011 — Demo businesses + Production hardening + Cloudflare/Portfolio/Migration docs

> **Codex CLI usage:** `cd C:\Projects\Radevu && codex` then paste this file.
> **Prerequisite:** chunks #1-10 merged. Phase 1 MVP feature work is COMPLETE. This chunk is the **launch-readiness pass**: seeds the two demo businesses (Δέσποινα φιλόλογος + Ιωάννης τεχνικός δικτύων), applies safe container hardening, and writes the runbooks for Cloudflare Tunnel, portfolio integration, and Pi → Hetzner migration.
>
> **Nothing in this chunk is a new feature.** It's preparation for going live + portfolio demo + documented escape hatches.

## Your role

Same as previous chunks. Read `C:\Users\Jiannis\.claude\skills\booking-saas-codex-context\SKILL.md` — follow §6 output format, §4 code style, §5 never-do list, the self-check.

Also load:
- `C:\Users\Jiannis\.claude\skills\booking-saas-project\SKILL.md` (§8 acquisition + onboarding — these demo businesses are part of the founder-led story)
- `C:\Projects\Radevu\docs\DESIGN.md` (§10 voice/tone strict — every Greek string anchored)
- `C:\Projects\Radevu\docs\VERTICALS.md` (verticals #3 φιλόλογος + #5 τεχνικός δικτύων — use the locked service lists verbatim)
- `C:\Projects\Radevu\docs\API.md`

## Task

Five logical units in one chunk. Treat them as one atomic deliverable — verification depends on all of them being in place.

1. **Seed two real demo businesses**: `despoina` (φιλόλογος) and `ioannis` (τεχνικός δικτύων). Keep existing `test-shop` for e2e tests. All three coexist in the dev DB.
2. **Safe container hardening** in compose: drop Linux capabilities, no-new-privileges, document the network isolation that already exists. **Skip `read_only: true`** — Next.js standalone needs writable `.next/cache`; that hardening pass is deferred to Phase 2.
3. **Cloudflare runbook** at `docs/CLOUDFLARE.md` covering Tunnel + Access for `/dashboard*` + Bot Fight Mode + Rate Limiting. Step-by-step, mobile-friendly.
4. **Portfolio integration guide** at `docs/PORTFOLIO.md` — copy-paste HTML/CSS card snippet for `wannabexaker.github.io`, recommended Greek/English copy, screenshot capture tips.
5. **Migration playbook** at `docs/MIGRATION.md` — Pi → Hetzner, with triggers, exact steps, rollback.

## Goal (testable outcome)

After this handoff:

1. **`pnpm --filter @radevu/db exec prisma db seed`** is **idempotent**: running it twice produces the same state without errors. Creates (if missing) or updates (if exists) three businesses + owners:
   - `test-shop` (κουρέας, `show_on_landing=false`, existing e2e fixture) — preserved unchanged
   - `despoina` (φιλόλογος Δέσποινα, `show_on_landing=true`)
   - `ioannis` (τεχνικός δικτύων Ιωάννης, `show_on_landing=true`)

2. **Landing showcase** at `http://localhost:3000/` renders 2 cards (Despoina + Ioannis), not 3. Test-shop hidden because `show_on_landing=false`.

3. **Public profile pages work** for all three slugs:
   - `/test-shop` → existing
   - `/despoina` → real profile with logo fallback (typography), photo (Unsplash URL), 4 services in Greek, working hours Δευ-Παρ 15:00-21:00 + Σαβ 10:00-14:00, contact phone + email
   - `/ioannis` → same shape with τεχνικός dataset, hours Δευ-Σαβ 09:00-20:00

4. **Owner login works** for all three:
   - `test-shop`: `barber@radevu.local` / `BarberDev123!` (existing)
   - `despoina`: `despoina@radevu.test` / `<SEED_DESPOINA_PASSWORD env>` (default `DespoinaDev2026!`)
   - `ioannis`: `ioannis@radevu.test` / `<SEED_IOANNIS_PASSWORD env>` (default `IoannisDev2026!`)

5. **Booking against demo profiles succeeds end-to-end**. Book a slot on `/despoina` using `<your-resend-signup-email>` as customer email → appointment created, customer record auto-created, confirmation + owner-alert emails fired (Resend sandbox limit: only the founder's signup email actually receives).

6. **Container hardening live** in `infra/docker-compose.prod.yml`:
   - `cap_drop: [ALL]` on the `web` service
   - `security_opt: [no-new-privileges:true]` on the `web` service
   - Same applied to `postgres` and `redis` services where compatible (Postgres needs `IPC_LOCK`? — verify; if needed, drop ALL then `cap_add: [IPC_LOCK]`)
   - Comment block above the `web` service documenting that ports 5432 and 6379 are NOT host-bound (intentional — internal bridge network only)
   - The dev `docker-compose.yml` gets the same hardening for consistency

7. **Cloudflare runbook** at `docs/CLOUDFLARE.md` complete:
   - Section 1: When to use this (after `radevu.gr` is registered + nameservers changed to Cloudflare)
   - Section 2: Create Tunnel `radevu-home`, copy token
   - Section 3: DNS records — A `radevu.gr` → Tunnel UUID, CNAME `*` → Tunnel UUID
   - Section 4: cloudflared service config on the Pi (systemd OR docker — pick docker, matches existing compose comment)
   - Section 5: Cloudflare Access for `dashboard.radevu.gr` — restrict to founder's Google email + magic-link backup
   - Section 6: Bot Fight Mode (on) + Rate Limit rule (block >60 req/min on /api/v1/*)
   - Section 7: Smoke test from external network (4G off WiFi)
   - Section 8: Killswitch and rollback procedure
   - Section 9: Cost (€0 — all free tier)

8. **Portfolio guide** at `docs/PORTFOLIO.md` complete:
   - Section 1: Architecture diagram (portfolio static + radevu.gr live, connected only by a link)
   - Section 2: Copy-paste HTML+CSS for a "Featured Project" card in `wannabexaker.github.io` (Tailwind classes if their portfolio uses Tailwind, plain CSS otherwise — pick plain CSS to be safe and provide both)
   - Section 3: Recommended Greek + English copy variants for the card
   - Section 4: Screenshot capture tips for the portfolio (Chrome DevTools 360×800 device emulation, Cmd+Shift+P "capture full size screenshot")
   - Section 5: Optional README badge for the GitHub repo ("Live demo →")
   - Section 6: When to update the portfolio screenshots (after major UI changes only — quarterly cadence)

9. **Migration playbook** at `docs/MIGRATION.md` complete:
   - Section 1: When to migrate (signals — power instability, ISP throttling, 20+ real users, Hetzner Storage Box savings outweigh Pi maintenance)
   - Section 2: Pre-migration checklist (Postgres backup, uploads tar, Tunnel token noted)
   - Section 3: Provision Hetzner CAX21 + Storage Box, set up SSH, install Docker + cloudflared
   - Section 4: scp data volumes + secrets
   - Section 5: docker compose up on Hetzner
   - Section 6: Point Cloudflare Tunnel at the new host (or keep Tunnel on Pi briefly for parallel run, then switch)
   - Section 7: DNS verification
   - Section 8: Rollback (just point Tunnel back to Pi; data already migrated either way, so no data loss either direction within the migration window)
   - Section 9: Final cost: ~€11/month (CAX21 €7 + Storage Box €4)

10. `pnpm -r typecheck` + Docker build + all 10 existing e2e tests (7 Playwright + 1 unit + the dashboard ones) + 1 new showcase e2e all pass.

## What's already in repo — do NOT modify

- `infra/.env.example`, `infra/SETUP.md` (only append, never rewrite)
- Dockerfile, GHA workflow, all infra otherwise
- All chunks #1-10 source files (apps/web/src/, packages/*, docs/) except those explicitly listed below
- The existing seed for `test-shop` — extend, don't replace

## Files you MUST create or modify (closed list)

### Slug constants (light touch)

- **MODIFY** `packages/shared/src/constants.ts` — add a new exported set `RESERVED_DEMO_SLUGS = new Set(["ioannis", "giannis", "despoina"])`. The slug validator does NOT auto-reject these (they're seedable) but the registration endpoint checks BOTH `RESERVED_SLUGS` and `RESERVED_DEMO_SLUGS`. Document in a comment: "Demo slugs are pre-claimed by the founder for live demos. Real customers with these first names should use a city or descriptor suffix (e.g., `despoina-athens`)."
- **MODIFY** `packages/shared/src/api/businesses.ts` — `registerBusinessSchema` refine now rejects both reserved sets. Error message in Greek: "Αυτό το slug είναι δεσμευμένο. Δοκίμασε ένα διαφορετικό."

### Seed expansion

- **MODIFY** `packages/db/prisma/seed.ts` — refactor to be cleanly idempotent. Pattern:
  - Helper `upsertBusinessWithOwner(spec)` that upserts the User first, then the Business linked to ownerId. Uses `prisma.user.upsert({ where: { email }, ... })` and `prisma.business.upsert({ where: { slug }, ... })`. Services: delete-and-recreate to keep them in sync with the spec on re-run.
  - Three specs: `test-shop` (existing — preserve all current values), `despoina`, `ioannis`.
  - Read passwords from env: `SEED_DESPOINA_PASSWORD ?? "DespoinaDev2026!"` and `SEED_IOANNIS_PASSWORD ?? "IoannisDev2026!"`. If env missing, log a single yellow warning line "[seed] using default demo passwords — set SEED_*_PASSWORD in .env for real deployments".
  - User creation MUST use better-auth's password hashing — call the auth helper, NOT `bcrypt` direct or any other library. If better-auth doesn't expose a "create user with hashed password" API usable from a standalone Node script, use Prisma's `account.password` field with the same hash format better-auth uses internally (read its source to confirm; this is the kind of detail that quietly breaks login). Document the choice in a comment.
  - Services for Despoina (verbatim from `docs/VERTICALS.md` §3, lock the prices and durations):
    - Ιδιαίτερο Γυμνασίου — 60 λεπτά — €18 (1800 cents)
    - Ιδιαίτερο Λυκείου — 60 λεπτά — €22 (2200 cents)
    - Πανελλήνιες – Έκθεση — 90 λεπτά — €28 (2800 cents)
    - Γνωριμία — 30 λεπτά — δωρεάν (0 cents)
  - Services for Ioannis (verbatim from VERTICALS §5):
    - Διάγνωση προβλήματος δικτύου — 60 λεπτά — €30 (3000 cents)
    - Εγκατάσταση router / switch — 90 λεπτά — €50 (5000 cents)
    - Επισκευή WiFi (signal / dead zones) — 60 λεπτά — €40 (4000 cents)
    - Setup VPN / firewall — 120 λεπτά — €80 (8000 cents)
    - Setup Pi-hole / DNS — 90 λεπτά — €60 (6000 cents)
  - Working hours per the VERTICALS doc.
  - Photo URLs (Unsplash, stable IDs, lightweight `?w=1200&q=70`):
    - Despoina: `https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&q=70` (books on a desk)
    - Ioannis: `https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=70` (network gear / server)
    - If either URL 404s on smoke test, swap with another Unsplash photo of similar tone and document the swap in the seed file comment.
  - Logo URLs: `null` for both. The Logo component falls back to typography per chunk #9, which works at small sizes.
  - Social links: omit for both (`{}` or null) — keep landing card clean. Owner can add later via Settings → Προφίλ.
  - Maps URL: omit for both. Same reasoning.
  - `notification_settings`: default `{ confirmation_enabled: true, reminder_enabled: true, reminder_lead_minutes: 1440 }` (covered by schema default — no need to set explicitly).
  - `show_on_landing`: `false` for `test-shop`, `true` for despoina + ioannis.

### Env

- **MODIFY** `infra/.env.example` — add at the bottom under a new `# === Demo seed credentials (Phase 0 only) ===` section: `SEED_DESPOINA_PASSWORD=` and `SEED_IOANNIS_PASSWORD=` with comments explaining they fall back to defaults if missing.
- **DO NOT** modify the existing `infra/.env` (out of scope, founder fills locally).

### Container hardening (safe)

- **MODIFY** `infra/docker-compose.prod.yml`:
  - On `web` service: add `cap_drop: [ALL]` and `security_opt: ["no-new-privileges:true"]`. Above the service block, add a comment block: "# Hardening: capability drop + no-new-privileges. Image runs as nodejs (uid 1001) per Dockerfile. Postgres/Redis ports are intentionally not host-bound — internal bridge network only."
  - On `postgres` service: add `cap_drop: [ALL]` and `cap_add: [DAC_OVERRIDE, SETGID, SETUID, FOWNER]` (Postgres init needs these; otherwise the container fails on first start). Add `security_opt: ["no-new-privileges:true"]`. Test on a fresh volume — if Postgres fails to init, document which cap was the blocker and add it.
  - On `redis` service: add `cap_drop: [ALL]` and `security_opt: ["no-new-privileges:true"]`. Redis runs fine with zero capabilities.
- **MODIFY** `infra/docker-compose.yml` (dev) — same hardening for consistency. Dev is local, but mirroring prod keeps "works on my machine" honest.

### Runbook docs (new)

- **CREATE** `docs/CLOUDFLARE.md` — 9 sections per the goal above. Mobile-friendly: short paragraphs, tappable commands in code blocks. Greek section headers where readable: "## Πότε χρησιμοποιείς αυτό", "## 1. Δημιουργία Tunnel", etc. The English commands stay English (`cloudflared tunnel run radevu-home`).
- **CREATE** `docs/PORTFOLIO.md` — 6 sections. Include the actual HTML + CSS card snippet (two variants: plain CSS and Tailwind utility classes — let the user pick based on their portfolio stack at `wannabexaker.github.io`). Reference the live URL `https://radevu.gr` (Phase 1+) and the local `http://radevu.local:3000` (Phase 0 — note that this is LAN-only so the portfolio link only works once domain is purchased).
- **CREATE** `docs/MIGRATION.md` — 9 sections. Concrete commands for each step. Include the env mapping (Pi `.env` keys → Hetzner `.env` keys are identical, only DATABASE_URL host changes from `postgres` to `postgres` still because of the bridge network — actually identical, easy migration).

### Existing doc updates

- **MODIFY** `infra/SETUP.md`:
  - In step 4 (data dirs), add an explicit chown line: `sudo chown -R 1001:1001 /srv/radevu` so the container's `nodejs` user can write uploads. Cite the chunk #9 acceptance discovery.
  - Add a new step 11 "Demo verification": "After deploy, verify `/despoina` and `/ioannis` profile pages render and the landing showcase shows 2 cards. If 0 cards, check `SELECT slug, show_on_landing FROM businesses;` — if rows missing, run the seed: `docker exec radevu-web pnpm --filter @radevu/db exec prisma db seed`."
  - Add a new step 12 "Cloudflare Tunnel": one-line pointer to `docs/CLOUDFLARE.md` (don't duplicate content here).
  - Add a new step 13 "Production hardening reference": one-line pointer "All container hardening is already in `infra/docker-compose.prod.yml` (cap drops + no-new-privileges)."

- **MODIFY** `docs/CODEX_TASKS.md` — add a new section under Module 0:
  ```
  ## Module 9: Launch readiness
  - [✓] TASK-025: Demo businesses seed (Δέσποινα + Ιωάννης). Done by Codex handoff #011.
  - [✓] TASK-026: Container hardening pass (cap drop, no-new-privileges). Done by Codex handoff #011.
  - [✓] TASK-027: Cloudflare + Portfolio + Migration runbooks. Done by Codex handoff #011.
  ```
  Phase 1 MVP **launch-ready**.

- **MODIFY** `docs/ARCHITECTURE.md` §12 (File storage) — add one paragraph: "Demo businesses Δέσποινα and Ιωάννης are seeded with Unsplash photo URLs (external — bypass `/uploads/`). Real businesses use the upload flow which stores under `/srv/radevu/uploads/<business_id>/`. The Logo component falls back to typography when no logo is uploaded."

- **MODIFY** `docs/API.md` — add a one-line note at the top of the Businesses table: "Slugs `ioannis`, `giannis`, `despoina` are pre-claimed by the founder for the live demo. Registration rejects them with `400 SLUG_RESERVED`."

### Tests

- **MODIFY** `apps/web/tests/e2e/booking-flow.spec.ts`, `apps/web/tests/e2e/booking-calendar.spec.ts`, `apps/web/tests/e2e/dashboard-today.spec.ts`, `apps/web/tests/e2e/dashboard-customers.spec.ts`, `apps/web/tests/e2e/settings-profile.spec.ts`, `apps/web/tests/e2e/notifications-settings.spec.ts` — any test that assumes `test-shop` is the only business in the DB must be updated to scope its assertions to `test-shop` specifically. If a test uses `await page.locator(".business-card").first()` or similar, narrow to `[data-slug="test-shop"]` or use the exact business name. **Do not rewrite logic, only narrow selectors where the seed expansion would break them.**
- **CREATE** `apps/web/tests/e2e/showcase.spec.ts` — Playwright at 360×800:
  - Navigate to `/`.
  - Assert exactly 2 showcase cards visible (despoina + ioannis).
  - Assert each card links to its profile.
  - Tap the despoina card → land on `/despoina` → see business name "Δέσποινα" (or the exact seeded name) and at least one service row.
  - Back, tap ioannis → land on `/ioannis` → same shape.
  - Under 15s.

### Slug reservation in API

- **MODIFY** `apps/web/src/app/api/v1/businesses/route.ts` (POST handler) — when validating slug, check BOTH `RESERVED_SLUGS` and `RESERVED_DEMO_SLUGS`. Return `400 { error: { code: "SLUG_RESERVED", message: "Αυτό το slug είναι δεσμευμένο." } }` when matched.

## Dependencies

**None new.** Better-auth + Prisma + ioredis + Resend already there. Seed extension reuses what we have.

## Hard rules

- TypeScript strict. No `any` without justification.
- Tailwind + existing primitives. No new components needed.
- All Greek strings per DESIGN.md §10 — every `ραντεβού` anchored, prefer `κράτηση`. The seed copy (service descriptions optional) is most exposed.
- Snake_case JSON keys. camelCase Prisma fields with `@map`.
- Seed is **idempotent** — must survive 5 consecutive runs with no errors. Use `upsert`, not `create`.
- Photos use Unsplash stable IDs (verify they load with a HEAD request as part of acceptance). If 404, swap and document the new URL in code.
- Container hardening must NOT break the app. Test Postgres startup on a FRESH volume — `docker compose -f infra/docker-compose.prod.yml down -v && up -d --build`. If Postgres fails to init, add the minimum required capability back and document why.
- Runbook docs are written in Greek where target reader is the founder during ops, English where commands are. Mixing is intentional and documented at the top of each doc: "Sections in Greek; commands in English. Treat both as canonical."
- No new npm packages.
- No placeholder/TODO. Demo profiles must look like real businesses, not "Lorem Ipsum".

## Pre-flight: grep audit

Before declaring done, grep your diff for literal "ραντεβού" and verify each occurrence is anchored. Report under "## ραντεβού audit". The seed file's service descriptions + the docs are most exposed.

## Acceptance criteria — run all

```bash
pnpm install
pnpm -r typecheck
pnpm --filter @radevu/db generate
# Fresh DB to verify Postgres survives the hardening
docker compose -f infra/docker-compose.yml --env-file infra/.env down -v
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d postgres redis
sleep 10
pnpm --filter @radevu/db migrate:deploy
pnpm --filter @radevu/db exec prisma db seed     # first run
pnpm --filter @radevu/db exec prisma db seed     # second run — must succeed without errors (idempotent)
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d --build web
sleep 30
curl -s http://localhost:3000/api/health
pnpm --filter @radevu/web test                    # unit tests
pnpm --filter @radevu/web test:e2e                # 7+1 existing + new showcase = 9 Playwright tests
```

Manual at 360×800:
- `http://localhost:3000/` → 2 showcase cards (Despoina + Ioannis), in that order or alphabetical.
- Tap Δέσποινα card → profile renders with 4 services, hours, photo, no broken images.
- Tap Κράτησε ραντεβού → calendar shows availability. Book a Tuesday afternoon slot using `<your-resend-signup-email>`. See confirmation.
- Log out, log in as `despoina@radevu.test` / `DespoinaDev2026!` → dashboard, Today tab shows the booking just made.
- Same flow for `/ioannis`.
- `http://localhost:3000/test-shop` still works (kept for e2e fixtures), but does NOT appear in landing.
- Try to register a business with slug `ioannis` → 400 SLUG_RESERVED with Greek message.
- Try slug `despoina-athens` → 201 created (suffix workaround).

Container hardening check:
- `docker exec radevu-web id` → uid=1001 gid=1001
- `docker exec radevu-web capsh --print` → "Current: =" (empty, all dropped)
- Try `docker exec -it radevu-web sudo whoami` → fails (no sudo / no-new-privileges)
- `docker compose ps` shows postgres + redis running healthy; their host-bound ports section is empty.

Doc smoke:
- `docs/CLOUDFLARE.md`, `docs/PORTFOLIO.md`, `docs/MIGRATION.md` all exist and render in any markdown previewer with proper headers + code blocks.

## Output format

Per `booking-saas-codex-context` §6:
- `## File: <path>` blocks
- `## Dependencies added` (expected: "None.")
- `## Files that need updating due to this change`
- `## ραντεβού audit`
- `## Seed verification` — short paragraph: idempotency tested how many times, password handling, photo URL HEAD-check results
- `## Container hardening notes` — which caps Postgres needed (if any), what was tested fresh-volume
- Self-check before returning

Scope: ONLY handoff-011.md. After this chunk, the codebase is **launch-ready**. Remaining work is non-coding: buy `radevu.gr`, deploy to Pi, set up Cloudflare Tunnel per `docs/CLOUDFLARE.md`, update portfolio per `docs/PORTFOLIO.md`. Stop when acceptance passes.
