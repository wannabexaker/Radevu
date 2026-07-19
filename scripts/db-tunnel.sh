#!/usr/bin/env bash
# Open a local tunnel to the PRODUCTION Radevu database on the Pi.
#
#   ./scripts/db-tunnel.sh           # open on 127.0.0.1:15432
#   ./scripts/db-tunnel.sh --status  # is it up?
#   ./scripts/db-tunnel.sh --close   # tear it down
#
# Why not simply forward port 5432 on the Pi: that port belongs to
# eye-postgres, a different project. Radevu's database is deliberately NOT
# published to the host, so we forward straight to the container's address on
# the docker network — resolved fresh each time, because it changes whenever
# the container is recreated.
#
# The tunnel runs under an SSH control socket rather than a bare background
# process, so --close works the same in Git Bash, WSL and Linux.

set -e

# PI_HOST (user@host of the Pi) stays out of the repo: set it in the
# environment, or in .scratch/db-tunnel.env (gitignored), e.g. PI_HOST=user@pi
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/../.scratch/db-tunnel.env" ]; then
  . "$SCRIPT_DIR/../.scratch/db-tunnel.env"
fi
PI_HOST="${PI_HOST:?Set PI_HOST=user@host (environment or .scratch/db-tunnel.env)}"
LOCAL_PORT="${LOCAL_PORT:-15432}"
CONTAINER="radevu-postgres"
SOCKET="${TMPDIR:-/tmp}/radevu-db-tunnel.sock"

case "$1" in
  --close)
    if ssh -S "$SOCKET" -O check "$PI_HOST" 2>/dev/null; then
      ssh -S "$SOCKET" -O exit "$PI_HOST" 2>/dev/null || true
      echo "Tunnel closed."
    else
      echo "No tunnel was open."
    fi
    exit 0
    ;;
  --status)
    if ssh -S "$SOCKET" -O check "$PI_HOST" 2>/dev/null; then
      echo "Tunnel is up on 127.0.0.1:${LOCAL_PORT}."
    else
      echo "Tunnel is down."
    fi
    exit 0
    ;;
esac

if ssh -S "$SOCKET" -O check "$PI_HOST" 2>/dev/null; then
  echo "Tunnel already open on 127.0.0.1:${LOCAL_PORT}."
  exit 0
fi

echo "Resolving ${CONTAINER} on ${PI_HOST}..."
DB_IP=$(ssh -o ConnectTimeout=15 "$PI_HOST" \
  "docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${CONTAINER}")

if [ -z "$DB_IP" ]; then
  echo "Could not resolve ${CONTAINER}. Is it running?" >&2
  exit 1
fi

ssh -f -N -M -S "$SOCKET" \
  -o ConnectTimeout=15 -o ExitOnForwardFailure=yes \
  -L "${LOCAL_PORT}:${DB_IP}:5432" "$PI_HOST"

cat <<EOF

Tunnel open: 127.0.0.1:${LOCAL_PORT} -> ${CONTAINER} (${DB_IP}:5432)

  Host      127.0.0.1
  Port      ${LOCAL_PORT}
  Database  radevu
  User      radevu
  Password  on the Pi: grep POSTGRES_PASSWORD ~/projects/radevu/infra/.env

This is PRODUCTION data. Close it when you are done:
  ./scripts/db-tunnel.sh --close
EOF
