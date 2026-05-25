# Codex Handoff #009 — Settings: profile editor + hours editor + file uploads

> **Codex CLI usage:** `cd C:\Projects\Radevu && codex` then paste this file.
> **Prerequisite:** chunks #1-8 merged. Booking flow with month calendar live. Owner currently can only set business profile fields at registration — this chunk gives them a Settings UI to update logo, photo, contact, social, Maps, working hours, on their own.

## Your role

Same as previous chunks. Read `C:\Users\Jiannis\.claude\skills\booking-saas-codex-context\SKILL.md` — follow §6 output format, §4 code style, §5 never-do list, the self-check.

Also load:
- `C:\Users\Jiannis\.claude\skills\booking-saas-project\SKILL.md` (§5 MVP scope — Settings tab is profile editor + services + visibility + hours; full theme customization = Phase 2)
- `C:\Projects\Radevu\docs\DESIGN.md` (§7 primitives, §10 voice/tone strict)
- `C:\Projects\Radevu\docs\API.md`
- `C:\Projects\Radevu\docs\ARCHITECTURE.md` (§8 schema — Business model has all the fields already)

## Task

Build the **profile editor** + **hours editor** under Settings, plus the file upload infrastructure. The Business model has all the fields from chunks #1-3 — this chunk surfaces them in an owner-editable UI for the first time.

Corresponds to TASK-017 (Settings profile editor) from `docs/CODEX_TASKS.md`. Notifications tab + reminder scheduler stay for later chunks.

## Goal (testable outcome)

After this handoff:

1. **Settings menu** at `/dashboard/settings` shows 4 entries (replaces today's 2):
   - **Προφίλ** → `/dashboard/settings/profile`
   - **Ωράριο λειτουργίας** → `/dashboard/settings/hours`
   - **Υπηρεσίες** → `/dashboard/settings/services` (exists, chunk #2)
   - **Εμφάνιση στο landing** → `/dashboard/settings/visibility` (exists, chunk #3)
   Each row: lucide icon (Settings2, Clock, Briefcase, Globe) + label + ChevronRight + ≥44px tap target.

2. **Profile editor** at `/dashboard/settings/profile` (mobile-first):
   - **Logo upload**: tap → file picker (accepts image/*) → preview → "Αποθήκευση" → POST upload → revalidate.
     - Max 5MB, accepted types: image/png, image/jpeg, image/webp.
     - Server resizes to thumbnail variants? **No** — Phase 1 stores original. Browser handles display sizing. Document this limitation in code comments.
     - Remove button "Αφαίρεση λογότυπου" → clears `logo_url`, deletes file from disk.
   - **Photo upload**: same pattern, accepts same types. Wider aspect ratio (4:3 or 16:9 hint in helper text).
   - **Name** (text input) — required, 2-100 chars.
   - **Phone** (text input) — optional, free format (no validation beyond length 5-20).
   - **Contact email** (text input) — optional, valid email format.
   - **Maps URL** (text input) — optional, must start with `https://maps.app.goo.gl/`, `https://maps.google.com/`, `https://goo.gl/maps/`, or `https://www.google.com/maps/`. Validate with zod.
   - **Social links**:
     - Instagram URL — optional, must start with `https://instagram.com/` or `https://www.instagram.com/`.
     - Facebook URL — optional, must start with `https://facebook.com/` or `https://www.facebook.com/` or `https://m.facebook.com/` or `https://www.fb.com/`.
     - Store as `{ instagram?: string, facebook?: string }` JSON in `social_links`.
   - "Αποθήκευση" button at bottom (sticky? or just at form end). On success: toast/inline message "Αποθηκεύτηκε" 2 seconds, then stays on page.
   - Cancel button → router.back().

3. **Hours editor** at `/dashboard/settings/hours`:
   - 7 day cards (Δευτέρα → Κυριακή in Greek week order).
   - Each card: toggle "Ανοιχτά" / "Κλειστά" (Radix Switch). When off, intervals collapse.
   - When on, list of intervals. Each interval: `<input type="time" step="900">` for open + close + remove button (✗).
   - "+ Προσθήκη ωραρίου" button below intervals → adds a new interval (default 09:00 – 17:00).
   - Validation:
     - Each interval: close > open (in same day; no overnight intervals in Phase 1).
     - Intervals don't overlap within the same day.
     - At least one interval per "Ανοιχτά" day.
   - Save button at bottom. Same revalidation pattern.
   - Helper text below the editor: "Αλλαγές στο ωράριο επηρεάζουν τις διαθέσιμες ώρες στο calendar των πελατών σου." (anchored, calm).

4. **Public profile reflects changes**:
   - Upload logo → `/test-shop` header logo updates on next page load.
   - Upload photo → profile hero photo updates.
   - Edit hours → month calendar in booking flow shows new density / closed days.
   - Edit social → footer links update.
   - Maps URL → "Δες στον χάρτη" button updates.

5. **Upload infrastructure**:
   - `POST /api/v1/businesses/:id/upload` (owner-only, multipart/form-data) with form field `kind` (`logo` | `photo`) and `file`. Returns `{ url: "/uploads/<business_id>/<kind>-<timestamp>.<ext>" }` on 201. Errors: 400 INVALID_TYPE, 413 FILE_TOO_LARGE, 401, 403.
   - `GET /uploads/[...path]` route handler streams files from `/srv/radevu/uploads/<path>`. Validates against path traversal. Sets `Content-Type` from extension. Cache headers: `Cache-Control: public, max-age=31536000, immutable` (filename has timestamp so file content is content-addressed; safe to cache forever).
   - Old file deletion: when owner uploads a new logo OR photo, the previous file (if any) is deleted from disk. When owner removes a logo OR photo, the file is deleted.
   - Failed delete (e.g., file already gone) logs warning, doesn't fail the request.

6. **Schema validation strict**:
   - Server re-validates all inputs (don't trust client). Zod refines on URLs match the allowlist patterns above.
   - Phone format: just length + character class (digits, spaces, `+`, `-`, `()`). No country-specific validation in Phase 1.

7. New e2e test `apps/web/tests/e2e/settings-profile.spec.ts` (one comprehensive test, not multiple):
   - Log in as seeded owner.
   - Navigate Settings → Προφίλ.
   - Upload a small fixture image (1x1 PNG) as logo.
   - Save name + phone + Maps URL.
   - Visit `/test-shop` → see uploaded logo in header.
   - Back to Settings → Ωράριο.
   - Toggle Κυριακή to Ανοιχτά, add 10:00-14:00 interval, save.
   - Visit `/test-shop`, open booking modal, navigate calendar to a Sunday → it should now be available (not grey).
   - Total flow under 30s.

8. `pnpm -r typecheck` + Docker build + all existing e2e tests still green (5 from chunk #8 + 1 dashboard-customers + 1 dashboard-today + 1 booking-flow = 8 existing + 1 new = 9).

## Design intent

This chunk is the OWNER's primary "I control my business" surface. Most users will visit this once or twice (set up the profile) and rarely after. So:
- **Errors are forgiving.** If URL doesn't match the allowlist, show "Πρέπει να είναι Instagram link, π.χ. https://instagram.com/myshop", not a regex dump.
- **Save buttons are decisive.** Single big "Αποθήκευση" at bottom of each editor. No autosave (would scare older users — "γιατί σώθηκε χωρίς να πατήσω τίποτα;").
- **Preview before commit** for image uploads — owner picks file, sees preview, taps save.
- **No drag-drop uploads.** Just `<input type="file">` tap to open native picker. Drag-drop is unfamiliar to non-tech users on mobile anyway.
- **Time inputs use native `<input type="time">`.** That's the OS-provided wheel picker on mobile. Best UX for older users.

## What's already in repo — do NOT modify

- `infra/*`, `.github/workflows/`, all settled infra
- Dockerfile already creates `/srv/radevu/uploads` directory with `nodejs:nodejs` ownership — do NOT change the Dockerfile
- All chunks #1-8 files except those explicitly listed under "Modify" below
- The booking flow, calendar, email layer, dashboard tabs, customers/debts — none touched here
- `apps/web/src/app/(protected-dashboard)/dashboard/settings/services/*` (chunk #2)
- `apps/web/src/app/(protected-dashboard)/dashboard/settings/visibility/*` (chunk #3)

## Files you MUST create or modify (closed list)

### Server-side

- **CREATE** `apps/web/src/lib/uploads.ts`:
  - `UPLOAD_ROOT = "/srv/radevu/uploads"` (constant — host-mounted volume).
  - `MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024`.
  - `ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"]`.
  - `saveUpload({ businessId, kind, file }): Promise<{ url, absolutePath }>` — validates, writes to `/srv/radevu/uploads/<businessId>/<kind>-<timestamp>.<ext>`. Returns the public URL `/uploads/<businessId>/<filename>`.
  - `deleteUploadByUrl(url): Promise<void>` — parses the URL, validates it's under UPLOAD_ROOT, deletes. Logs warning if file missing.
  - `resolveUploadPath(relativePath): string | null` — used by the GET handler. Joins UPLOAD_ROOT + relativePath, then verifies the resolved path is still inside UPLOAD_ROOT (path traversal guard via `path.resolve` + `startsWith` check). Returns null on traversal attempt.
  - JSDoc on every export.

- **CREATE** `apps/web/src/lib/business-profile.ts`:
  - `updateBusinessProfile(businessId, ownerId, patch): Promise<Business>` — applies the patch (name, contact_email, contact_phone, logo_url, photo_url, social_links, maps_url, working_hours). Validates ownership inside the function. Revalidation handled by callers.
  - `clearLogo(businessId, ownerId): Promise<void>` — deletes file + clears `logo_url`.
  - `clearPhoto(businessId, ownerId): Promise<void>` — same for photo.

### API

- **CREATE** `apps/web/src/app/uploads/[...path]/route.ts` — `GET` handler. Streams file via `Response` with appropriate `Content-Type` and immutable cache headers. 404 on missing file. 400 on path traversal attempt.

- **CREATE** `apps/web/src/app/api/v1/businesses/[id]/upload/route.ts` — `POST` multipart. Owner-only. Reads FormData, validates `kind`, validates file, calls `saveUpload`, deletes old file for that kind if any, updates business with new URL, returns `{ url }` 201.

- **MODIFY** `apps/web/src/app/api/v1/businesses/[id]/route.ts` (the PATCH handler) — extend to accept the full profile field set: `name?`, `contact_email?`, `contact_phone?`, `logo_url?` (null clears), `photo_url?` (null clears), `social_links?`, `maps_url?`, `working_hours?`. Uses the new `updateBusinessProfile` helper. Validates against the new shared schema.

### Shared

- **CREATE** `packages/shared/src/api/business-profile.ts`:
  - `updateBusinessProfileSchema` — partial of all editable fields with refinements:
    - Maps URL allowlist regex
    - Social Instagram + Facebook allowlist regex
    - Phone length 5-20 + character class `/^[\d\s+\-()]+$/`
    - Email valid format if present
  - `workingHoursSchema` — `{ mon, tue, wed, thu, fri, sat, sun }`, each an array of `{ open: "HH:mm", close: "HH:mm" }`. Refines: `close > open` lexicographically AND intervals within a day don't overlap.
  - `socialLinksSchema` — `{ instagram?: string, facebook?: string }`.
  - Export inferred types.
- **MODIFY** `packages/shared/src/index.ts` — re-export new module.

### Pages + components

- **MODIFY** `apps/web/src/app/(protected-dashboard)/dashboard/settings/page.tsx` — replace current 2-entry menu with 4-entry menu (Προφίλ, Ωράριο, Υπηρεσίες, Εμφάνιση στο landing).

- **CREATE** `apps/web/src/app/(protected-dashboard)/dashboard/settings/profile/page.tsx` — server component, loads business, renders `<ProfileEditor business={...} />`.

- **CREATE** `apps/web/src/app/(protected-dashboard)/dashboard/settings/profile/ProfileEditor.tsx` — client component. State for all editable fields. Two `<input type="file">` for logo + photo with preview. Save button at bottom. Calls server actions.

- **CREATE** `apps/web/src/app/(protected-dashboard)/dashboard/settings/profile/actions.ts`:
  - `saveProfile(formData): Promise<{ ok: true } | { ok: false, error }>` — server action. Validates with `updateBusinessProfileSchema`. Calls `updateBusinessProfile`. Revalidates `/test-shop` and `/dashboard/settings/profile` and `/` (landing showcase).
  - `uploadLogoAction(formData)` and `uploadPhotoAction(formData)` — server actions that wrap the multipart upload endpoint internally OR call the file save helper directly. Decide based on what works cleanest for Next.js 15 server actions.
  - `removeLogoAction()`, `removePhotoAction()`.

- **CREATE** `apps/web/src/app/(protected-dashboard)/dashboard/settings/hours/page.tsx` — server component, loads working_hours, renders `<HoursEditor initialHours={...} />`.

- **CREATE** `apps/web/src/app/(protected-dashboard)/dashboard/settings/hours/HoursEditor.tsx` — client component. State = mutable working hours object. Per-day card with switch + intervals. Validation on save (close > open, no overlaps).

- **CREATE** `apps/web/src/app/(protected-dashboard)/dashboard/settings/hours/actions.ts`:
  - `saveHours(workingHours): Promise<{ ok: true } | { ok: false, error }>` — server action. Validates with `workingHoursSchema`. Calls `updateBusinessProfile`. Revalidates the same paths + `/api/v1/businesses/<id>/availability/month` (Next.js cache for the calendar).

- **CREATE** `apps/web/src/components/settings/SettingsMenuItem.tsx` — reusable row for the settings menu. Props: icon, label, href.

- **CREATE** `apps/web/src/components/settings/ImageUploadField.tsx` — wraps `<input type="file">` + preview + save/remove buttons. Props: `kind`, `currentUrl`, `aspectHint`, `uploadAction`, `removeAction`. Shows preview using next/image OR plain `<img>`. Shows file size warning if >5MB before submit (client-side gentle warning).

- **CREATE** `apps/web/src/components/settings/HoursDayCard.tsx` — one day's card with switch + intervals. Props: dayKey, dayLabel, intervals, onChange.

- **CREATE** `apps/web/src/components/settings/IntervalRow.tsx` — single `{open, close, remove}` row.

- **CREATE** `apps/web/src/components/settings/ToastInline.tsx` (or reuse if a similar component exists from earlier chunks — check before creating duplicate). Two-second inline success message with checkmark + Greek text.

### Tests

- **CREATE** `apps/web/tests/e2e/settings-profile.spec.ts` — Playwright at 360×800. The full flow described in Goal #7 above. Use a 1x1 PNG fixture in `apps/web/tests/fixtures/tiny.png` — create that file too. Under 30s.

### Docs

- **MODIFY** `docs/API.md`:
  - Update Businesses PATCH row body description to include the new editable fields.
  - Add new row: `POST /api/v1/businesses/:id/upload` (Owner, multipart) → `201 { url }` with errors INVALID_TYPE, FILE_TOO_LARGE.
  - Add note about the `GET /uploads/[...path]` static-style route (public, cached).
- **MODIFY** `docs/ARCHITECTURE.md` §8 — clarify the `working_hours` JSON shape with an example. Add §12 "File storage" describing the `/srv/radevu/uploads` volume + the path layout + the GET route + cache strategy.
- **MODIFY** `docs/CODEX_TASKS.md` — mark TASK-017 done. TASK-016 (Notifications tab) becomes pending — blocked on reminder scheduler. Add TASK-024: "Reminder scheduler — chunk #10."

## Dependencies

**None new.** Multipart parsing in Next.js 15 server actions / route handlers is native (`request.formData()`). File I/O via Node `fs/promises`. No `multer`, no `sharp` (image resizing deferred to Phase 2).

## Hard rules

- TypeScript strict. No `any` without justification.
- Tailwind + existing shadcn primitives. No inline styles. No CSS modules.
- Mobile-first 360×800. Tap targets ≥44px.
- All Greek strings per DESIGN.md §10. Helper texts anchor "ραντεβού" usage (e.g., "calendar των πελατών σου" not "ραντεβού σου").
- Snake_case JSON keys in API.
- File uploads go to `/srv/radevu/uploads/<business_id>/<kind>-<timestamp>.<ext>` ONLY. Never outside that root. Path traversal must be impossible from any input.
- Image content is served via the new `/uploads/[...path]` GET route. Never embed file contents in HTML, never base64.
- Old files deleted on replace/remove. Failed deletion logs warning, doesn't fail the user's action.
- Server actions revalidate the relevant paths (`/test-shop`, `/`, `/dashboard/settings/*`).
- Never hardcode TLDs/domains/emails — env-driven.
- No new npm packages. No image resizing this chunk.
- No placeholder/TODO. Notifications tab stays as its existing chunk #1 placeholder.

## Pre-flight: grep audit

Before declaring done, grep your diff for literal "ραντεβού" and verify every occurrence is anchored per DESIGN.md §10. Report results under "## ραντεβού audit". Especially watch the Hours editor helper text and the Profile editor save toasts.

## Acceptance criteria — run all

```bash
pnpm install
pnpm -r typecheck
pnpm --filter @radevu/db generate
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d --build web
sleep 30
curl -s http://localhost:3000/api/health
pnpm --filter @radevu/web test:e2e      # 9 tests total, all green
```

Manual at 360×800:
- Log in as seeded owner. Settings menu shows 4 entries.
- Tap Προφίλ. Upload a small PNG as logo. See preview. Save. Toast appears. Visit `/test-shop` — logo in header updates.
- Back to Προφίλ. Upload photo. Edit Maps URL with `https://maps.app.goo.gl/abc`. Edit Instagram with `https://instagram.com/test`. Save.
- `/test-shop` — photo + maps button + Instagram link all reflect changes.
- Back to Settings → Ωράριο. Toggle Κυριακή to Ανοιχτά. Add 10:00–14:00. Save.
- Open booking modal on `/test-shop`, navigate to a Sunday. Day is no longer grey, has a density dot.
- Try to upload a non-image file (e.g., a .txt) → 400 INVALID_TYPE.
- Try to upload a >5MB file → 413 FILE_TOO_LARGE.
- Try to PATCH `social_links.instagram` with `https://example.com/scam` → 400 VALIDATION_ERROR.
- Try `GET /uploads/../../etc/passwd` → 400 or 404 (NOT 200 with file contents).

## Output format

Per `booking-saas-codex-context` §6:
- `## File: <path>` blocks
- `## Dependencies added` (expected: "None.")
- `## Files that need updating due to this change`
- `## ραντεβού audit` — grep results + per-line comment
- `## File storage notes` — short paragraph: where files live, path layout, cache headers, traversal guard approach
- Self-check before returning

Scope: ONLY handoff-009.md. Notifications tab + reminder scheduler stay for chunk #10. Stop when acceptance passes.
