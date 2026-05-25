# Pi 4 Bring-up Runbook (Beta Phase 0)

Goal: Raspberry Pi 4 (8GB) running Radevu in Docker, reachable at `radevu.local:3000` over LAN, with nightly backups.

Deploy pattern: **GitHub Actions builds ARM64 image → GHCR → Pi pulls.** No build on the Pi (saves CPU, dodges QEMU SIGILL). Same pattern as Eye_in_the_Sky.

Estimated time: 60–90 minutes first time (assuming Pi already has Docker).

## Prerequisites

- Raspberry Pi 4 Model B, 8GB RAM, Raspberry Pi OS 64-bit, Docker installed, SSH enabled.
- Active cooling.
- LAN connection (Ethernet preferred for a server).
- A GitHub account with the Radevu repo cloned.

USB SSD for Postgres data is **strongly recommended** but **deferred** for early dev (SD card OK for now, accept that DB writes accelerate SD wear; migrate to USB SSD before going live with real businesses).

## 1. Verify Pi state

```bash
ssh radevu@radevu.local
docker --version            # expect 24+ or newer
docker compose version      # expect 2.x
docker ps                   # list running containers (eg pi-hole)
docker network ls           # check existing networks
ss -tlnp | grep -E ':(3000|5432|6379|8000|80|53)\b'   # port check
```

If port 3000 is taken by Eye_in_the_Sky (or other), stop it: `docker stop eye-player-web eye-admin-web eye-api eye-postgres` (or whatever you named those containers).

Pi-hole on port 80 is fine — Radevu uses 3000. No conflict.

## 2. Avahi (mDNS) for `radevu.local`

If you reach the Pi at `radevu.local` already (because Pi-hole or the OS image set hostname to `radevu`), skip this step. Otherwise:

```bash
sudo apt install -y avahi-daemon
sudo systemctl enable --now avahi-daemon
sudo hostnamectl set-hostname radevu
```

Reboot the Pi if hostname changed.

## 3. Firewall — LAN-only access

```bash
sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw allow from 192.168.0.0/16 to any port 22       # SSH
sudo ufw allow from 192.168.0.0/16 to any port 3000     # Radevu web
sudo ufw enable
```

Adjust `192.168.0.0/16` to your actual home subnet. **Do NOT** open these ports to the internet — Beta Phase 0 is LAN-only. External access comes in Beta Phase 1 via Cloudflare Tunnel.

## 4. Data dirs

```bash
sudo mkdir -p /srv/radevu/uploads
sudo chown -R radevu:radevu /srv/radevu
sudo chown -R 1001:1001 /srv/radevu           # chunk #9 acceptance: container nodejs user needs write access
sudo chown -R 1001:1001 /srv/radevu/uploads   # container nodejs user writes uploaded logos/photos
```

Backups dir (when you mount the external USB SSD later, point this to it):

```bash
sudo mkdir -p /mnt/backup/radevu
sudo chown -R radevu:radevu /mnt/backup
```

For now (no USB SSD yet), backups go to the SD card under `/var/backups/radevu` — short retention, manual scp to dev machine. Update `infra/backup.sh` and `infra/crontab.example` paths if needed.

## 5. Clone repo on the Pi

```bash
cd ~
git clone https://github.com/<your-github-user>/Radevu.git radevu
cd radevu
cp infra/.env.example infra/.env
nano infra/.env             # fill in: GHCR_USER, POSTGRES_PASSWORD, BETTER_AUTH_SECRET, RESEND_API_KEY
```

Generate secrets:
```bash
openssl rand -base64 32     # → POSTGRES_PASSWORD
openssl rand -hex 32        # → BETTER_AUTH_SECRET
```

For RESEND_API_KEY: sign up at https://resend.com (free, no CC), create an API key, paste it.

## 6. GHCR pull permission

If your Radevu repo is **public**, the GHCR image is public — no auth needed on the Pi. Skip this step.

If **private**, generate a GitHub Personal Access Token with `read:packages` scope, then:

```bash
echo <YOUR_TOKEN> | docker login ghcr.io -u <your-github-user> --password-stdin
```

## 7. First deploy

Trigger the GitHub Actions workflow (push to `main` or run `workflow_dispatch`). Wait until it finishes (the build pushes `ghcr.io/<user>/radevu-web:latest`).

On the Pi:

```bash
cd ~/radevu
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env pull
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env up -d
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env ps
docker logs -f radevu-web
```

Wait for the `web` service to become healthy (`status: running (healthy)`).

## 8. Smoke test

From a phone on the same WiFi:

- `http://radevu.local:3000/api/health` → `200 { status: "ok", db: "ok", redis: "ok" }`
- `http://radevu.local:3000/` → landing page renders at 360px without horizontal scroll
- `http://radevu.local:3000/dashboard/register` → registration form

## 9. Backup cron (when USB SSD is ready)

```bash
sudo cp ~/radevu/infra/backup.sh /usr/local/bin/radevu-backup.sh
sudo chmod +x /usr/local/bin/radevu-backup.sh
sudo crontab -e
# paste the line from infra/crontab.example
```

Until USB SSD is mounted, run backups manually every few days: `sudo /usr/local/bin/radevu-backup.sh` and `scp` the result to your dev machine.

## 10. Update flow (every time GitHub Actions publishes a new image)

```bash
cd ~/radevu
git pull
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env pull web
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env up -d web
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env logs -f web
```

## 11. Demo verification

After deploy, verify the live demo profiles:

```bash
curl -I http://radevu.local:3000/despoina
curl -I http://radevu.local:3000/ioannis
```

Open `http://radevu.local:3000/` on a phone. The showcase should show exactly 2 cards: Despoina and Ioannis. If it shows 0 cards, check the database:

```bash
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env exec postgres psql -U radevu -d radevu -c "SELECT slug, show_on_landing FROM businesses ORDER BY slug;"
```

If the demo rows are missing, run the seed from a machine that has the repo dependencies installed:

```bash
pnpm --filter @radevu/db exec prisma db seed
```

## 12. Cloudflare Tunnel

When `radevu.gr` is registered and nameservers point to Cloudflare, follow `docs/CLOUDFLARE.md`. Keep this setup LAN-only until that runbook is complete.

## 13. Production hardening reference

Container hardening is already in `infra/docker-compose.prod.yml`: capability drops, `no-new-privileges`, and no host-bound Postgres/Redis ports.

## 14. Beta Phase 1 transition (when radevu.gr is registered)

1. Buy `radevu.gr` at papaki.gr.
2. In Cloudflare: add domain, change nameservers at papaki.
3. Cloudflare Zero Trust → Tunnels → create tunnel `radevu-home`. Copy the tunnel token.
4. Add DNS in Cloudflare: `radevu.gr` and `*.radevu.gr` → tunnel UUID.
5. In `infra/.env`: set `CLOUDFLARE_TUNNEL_TOKEN`, change `BOOKING_BASE_DOMAIN=radevu.gr`, `ROUTING_MODE=subdomain`, `BETTER_AUTH_URL=https://dashboard.radevu.gr`, `RESEND_FROM_EMAIL=noreply@radevu.gr`.
6. Uncomment the `cloudflared` service in `infra/docker-compose.prod.yml`.
7. `docker compose -f infra/docker-compose.prod.yml --env-file infra/.env up -d`.
8. Smoke test from external network (4G, WiFi off): `https://test-business.radevu.gr` resolves and renders.

## Troubleshooting

**`exec format error` on web container start** → image was built for wrong architecture. Check the GHA workflow built `linux/arm64`. Re-run.

**`db: "error"` on /api/health** → Postgres not ready or wrong DATABASE_URL. `docker logs radevu-postgres`. Verify `POSTGRES_PASSWORD` matches in `.env` and `DATABASE_URL`.

**Container restart loop** → `docker logs radevu-web` for the actual error. Usually missing env var.

**Pi-hole DNS interferes** → if `radevu.local` doesn't resolve, check Pi-hole's local DNS records and add a record `radevu.local → <pi IP>` if needed. Or rely on avahi mDNS (most clients prefer mDNS over DNS for `.local`).
