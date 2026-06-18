# Ops runbook — Rotate seeded owner passwords

A **dev/ops maintenance tool**, not part of the Radevu app. It changes the
**login passwords** of the seeded business owners (Δέσποινα, Ιωάννης, Αντώνης,
Ματίνα, Αγγελική, Ελένη) in whatever database `DATABASE_URL` points to.

Script: [`scripts/set-passwords.mjs`](../../scripts/set-passwords.mjs)

## Why this exists
The repo is **public**, so the demo/fallback passwords in `seed.ts` are visible
to everyone. Production must therefore use strong, secret passwords. This tool
rotates them safely without re-running the whole seed.

## What it does (and does not)
- Targets owners by business **slug**, so it works the same locally or in prod
  regardless of each owner's current email.
- Hashes with **better-auth's own hasher**, so the stored hash matches a real
  sign-up (login keeps working).
- Touches **only** the credential password. Never businesses, services,
  customers, or appointments.
- For each owner: uses `SEED_<NAME>_PASSWORD` from the environment **if set**,
  otherwise **generates a strong random** password. Prints the full list once —
  **save it somewhere safe** (it is not stored anywhere else).

## Run it locally
```bash
DATABASE_URL="postgresql://radevu:radevu_dev_password@localhost:5433/radevu?schema=public" \
  node scripts/set-passwords.mjs
```
(Adjust the URL to your local Postgres — the value above matches `pnpm dev:infra`.)

To set specific passwords instead of random ones, export them first:
```bash
SEED_IOANNIS_PASSWORD='your-strong-pass' \
DATABASE_URL="postgresql://radevu:radevu_dev_password@localhost:5433/radevu?schema=public" \
  node scripts/set-passwords.mjs
```

## Run it on the Raspberry Pi (production)
The prod database is the `postgres` service inside the Docker compose network, so
the script must run **inside that network** with the repo mounted. From
`~/projects/radevu` on the Pi:

1. Find the compose network name:
   ```bash
   docker network ls | grep radevu
   ```
2. Make sure `infra/.env` holds the prod `DATABASE_URL` (host `postgres`) and the
   strong `SEED_*_PASSWORD` values you want (the script reads `infra/.env`
   automatically and will use those env values instead of generating random ones).
3. Run a one-off Node container on that network:
   ```bash
   docker run --rm \
     --network <network-from-step-1> \
     -v ~/projects/radevu:/app -w /app \
     node:22-alpine node scripts/set-passwords.mjs
   ```
4. **Save the printed passwords.**

> Note: the normal deploy seed also sets owner passwords from `SEED_*_PASSWORD`
> (the seed now *requires* them in production). This script is for **ad-hoc**
> rotation between deploys, or to rotate without touching anything else.

## After rotating
- If you generated random passwords, copy them into `infra/.env` as
  `SEED_*_PASSWORD` so a future seed keeps the same passwords (otherwise the next
  seed would set its own).
- Treat the printed output as a secret — clear your terminal scrollback if shared.
