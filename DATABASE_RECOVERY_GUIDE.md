# Database Recovery Guide

## Environment confirmation

```bash
ssh big-vps
sudo docker exec fleet-postgres psql -U postgres -d badawiasimports_staging -c "SELECT current_database(), version();"
sudo docker exec fleet-postgres psql -U postgres -d badawiasimports -c "SELECT current_database();"
```

Do **not** assume a URL containing “staging” is non-production — always print `current_database()`.

## Backup (logical)

```bash
# Staging
sudo docker exec fleet-postgres pg_dump -U postgres -d badawiasimports_staging \
  --format=custom -f /tmp/badawiasimports_staging_$(date +%Y%m%d).dump

# Production
sudo docker exec fleet-postgres pg_dump -U postgres -d badawiasimports \
  --format=custom -f /tmp/badawiasimports_$(date +%Y%m%d).dump

# Copy off-box
scp big-vps:/tmp/badawiasimports_*.dump ./backups/
```

Fleet also maintains `/data/fleet/backups` — check `sudo fleet db list` / backup scripts.

## Schema-only export

```bash
sudo docker exec fleet-postgres pg_dump -U postgres -d badawiasimports_staging --schema-only > schema_staging.sql
```

## Restore

```bash
# WARNING: replaces target DB contents
sudo docker exec -i fleet-postgres pg_restore -U postgres -d badawiasimports_staging --clean --if-exists < backup.dump
```

Prefer restore into a new DB name first, then cut over.

## Migration rollback

1. Keep the applied SQL file from `supabase/migrations/`.
2. For additive migrations (20260802), reverse using notes in `MIGRATION_STATUS_REPORT.md`.
3. Re-deploy previous app commit if code depends on new tables (health check expects ledgers).

## Payment record preservation

Never drop `orders`, `order_items`, `payment_callback_events`, or `payment_attempts` during recovery experiments.  
Export those four tables before any destructive test:

```bash
sudo docker exec fleet-postgres pg_dump -U postgres -d badawiasimports \
  -t orders -t order_items -t payment_callback_events -t payment_attempts \
  > /tmp/payments_slice.sql
```

## Post-restore verification

```bash
curl -sS https://badawiasimports-staging.169-58-8-203.sslip.io/api/health
# expect database=up, schema=ok
sudo docker exec fleet-postgres psql -U postgres -d badawiasimports_staging -c \
  "SELECT count(*) FROM orders; SELECT count(*) FROM products; SELECT count(*) FROM auth.users;"
```
