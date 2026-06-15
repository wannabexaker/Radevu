#!/usr/bin/env bash
# pi-update.sh — pull + redeploy Radevu on the Pi, no surprises.
#
# Mirrors the eye-in-the-sky update pattern: show current SHAs, pull,
# recreate only changed services, wait for healthy, probe the public URL.
#
# Run from ~/projects/radevu on the Pi:
#   ./scripts/pi-update.sh
#
# Exit codes: 0 ok, 1 misc failure, 2 health-check failed, 3 probe failed.

set -euo pipefail

COMPOSE_BASE="infra/docker-compose.prod.yml"
COMPOSE_PI="infra/docker-compose.pi.yml"
ENV_FILE="infra/.env"
PROBE_URL="https://radevu.olamov.com/api/health"
LOCAL_PROBE="http://localhost:3300/api/health"
WAIT_SECONDS=60

bold() { printf '\033[1m%s\033[0m\n' "$*"; }
red()  { printf '\033[31m%s\033[0m\n' "$*"; }
green(){ printf '\033[32m%s\033[0m\n' "$*"; }

[ -f "$ENV_FILE" ] || { red "missing $ENV_FILE"; exit 1; }
[ -f "$COMPOSE_BASE" ] || { red "missing $COMPOSE_BASE"; exit 1; }
[ -f "$COMPOSE_PI" ] || { red "missing $COMPOSE_PI"; exit 1; }

COMPOSE=(docker compose -f "$COMPOSE_BASE" -f "$COMPOSE_PI" --env-file "$ENV_FILE")

bold "Current images (before pull)"
"${COMPOSE[@]}" images || true

bold "Pulling images from GHCR"
"${COMPOSE[@]}" pull

bold "Recreating changed services"
"${COMPOSE[@]}" up -d --remove-orphans

bold "Waiting up to ${WAIT_SECONDS}s for web to be healthy"
deadline=$(( $(date +%s) + WAIT_SECONDS ))
while :; do
  status=$("${COMPOSE[@]}" ps --format json web 2>/dev/null \
    | python3 -c "import sys,json; xs=[json.loads(l) for l in sys.stdin if l.strip()]; print(xs[0].get('Health','') if xs else '')" 2>/dev/null || true)
  if [ "$status" = "healthy" ]; then
    green "web healthy"
    break
  fi
  if [ "$(date +%s)" -ge "$deadline" ]; then
    red "web did not become healthy within ${WAIT_SECONDS}s"
    "${COMPOSE[@]}" logs --tail=80 web || true
    exit 2
  fi
  sleep 3
done

bold "Local health probe ($LOCAL_PROBE)"
code=$(curl -sS -o /dev/null -w '%{http_code}' "$LOCAL_PROBE" || echo 000)
if [ "$code" != "200" ]; then
  red "local probe failed: HTTP $code"
  exit 3
fi
green "local probe HTTP $code"

bold "Public probe ($PROBE_URL)"
code=$(curl -sS -o /dev/null -w '%{http_code}' "$PROBE_URL" || echo 000)
if [ "$code" != "200" ]; then
  red "public probe failed: HTTP $code (DNS or tunnel issue?)"
  exit 3
fi
green "public probe HTTP $code"

bold "Deploy complete"
