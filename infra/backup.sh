#!/usr/bin/env bash
set -euo pipefail

# Radevu nightly backup script
# Runs from cron, see infra/crontab.example.
# Writes to /mnt/backup which must be a mounted external drive.

BACKUP_ROOT="/mnt/backup/radevu"
DB_NAME="${POSTGRES_DB:-radevu}"
DB_USER="${POSTGRES_USER:-radevu}"
UPLOADS_DIR="/srv/radevu/uploads"
DATE=$(date +%Y-%m-%d)
RETENTION_DAILY=30
RETENTION_MONTHLY=12

mkdir -p "$BACKUP_ROOT/postgres/daily" "$BACKUP_ROOT/postgres/monthly"
mkdir -p "$BACKUP_ROOT/uploads/daily"  "$BACKUP_ROOT/uploads/monthly"

# Postgres dump via running container
docker exec radevu-postgres pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_ROOT/postgres/daily/${DATE}.sql.gz"

# Uploads tar
if [ -d "$UPLOADS_DIR" ]; then
  tar -czf "$BACKUP_ROOT/uploads/daily/${DATE}.tar.gz" -C "$(dirname "$UPLOADS_DIR")" "$(basename "$UPLOADS_DIR")"
fi

# First-of-month → copy to monthly
if [ "$(date +%d)" = "01" ]; then
  cp "$BACKUP_ROOT/postgres/daily/${DATE}.sql.gz" "$BACKUP_ROOT/postgres/monthly/${DATE}.sql.gz"
  [ -f "$BACKUP_ROOT/uploads/daily/${DATE}.tar.gz" ] && cp "$BACKUP_ROOT/uploads/daily/${DATE}.tar.gz" "$BACKUP_ROOT/uploads/monthly/${DATE}.tar.gz"
fi

# Retention prune
find "$BACKUP_ROOT/postgres/daily"   -name '*.sql.gz'  -type f -mtime "+${RETENTION_DAILY}" -delete
find "$BACKUP_ROOT/uploads/daily"    -name '*.tar.gz'  -type f -mtime "+${RETENTION_DAILY}" -delete
find "$BACKUP_ROOT/postgres/monthly" -name '*.sql.gz'  -type f -mtime "+$((RETENTION_MONTHLY*31))" -delete
find "$BACKUP_ROOT/uploads/monthly"  -name '*.tar.gz'  -type f -mtime "+$((RETENTION_MONTHLY*31))" -delete

echo "$(date -Iseconds) backup complete: ${DATE}"
