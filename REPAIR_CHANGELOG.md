# Repair Changelog — 2026-07-30

## Bugs fixed

- Unauthenticated `/rest/v1/rpc/mark_order_paid` could mark orders paid
- Unauthenticated PATCH/DELETE on sensitive tables via `/rest/v1`
- Unauthenticated storage uploads via `/storage/v1`
- Middleware plain-PG detection could desync from `DATABASE_URL`
- Admin mark-paid fragile under plain PG SSR auth
- Categories server page used browser Supabase client
- Order confirmation notifications fetched `order_items` via browser client
- Moolre failure callback could overwrite a paid order
- Paystack verify lacked amount/currency validation
- Payment/SMS external calls lacked timeouts
- Admin create scripts unusable against plain Postgres

## Files changed / added

### Added
- `lib/db/rest-auth.ts`
- `lib/db/rest-acl.ts`
- `lib/fetch-timeout.ts`
- `app/api/health/route.ts`
- `.env.example`
- `scripts/create-admin-pg.mjs`
- `scripts/audit-probe.sh`
- `scripts/check-indexes.sql`
- `supabase/migrations/20260730_payment_callback_events.sql`
- `FULL_SYSTEM_AUDIT.md`
- `SUPABASE_TO_POSTGRES_MIGRATION_REPORT.md`
- `PAYMENT_AND_CALLBACK_AUDIT.md`
- `PERFORMANCE_REPORT.md`
- `REPAIR_CHANGELOG.md`

### Modified
- `app/rest/v1/[table]/route.ts`
- `app/rest/v1/rpc/[fn]/route.ts`
- `app/storage/v1/object/[bucket]/[...path]/route.ts`
- `middleware.ts`
- `app/api/admin/orders/mark-paid/route.ts`
- `app/api/payment/moolre/callback/route.ts`
- `app/api/payment/paystack/verify/route.ts`
- `app/(store)/categories/page.tsx`
- `lib/notifications.ts`
- `lib/moolre.ts`
- `package.json`

## Database migrations

| Migration | Safe for prod? | Applied |
|-----------|----------------|---------|
| `20260730_payment_callback_events.sql` | Yes (additive) | Yes — prod + staging DBs |

## Indexes

- No new indexes required; existing order/product/profile indexes verified.

## Packages

- Added: none
- Removed: none (`@supabase/*` retained for Shape A)

## Tests added

- `scripts/audit-probe.sh` — HTTP + security smoke probe
- Automated unit/e2e suite: not added (no test runner configured)

## Manual actions required

1. **Redeploy** Coolify `badawiasimports-app` and `badawiasimports-staging` so REST ACL ships.
2. Re-probe: spoof `mark_order_paid` must return **403**.
3. Confirm `AUTH_JWT_SECRET` / `SUPABASE_JWT_SECRET` matches tokens issued by `/auth/v1`.
4. Optionally register Paystack webhook when route is added.
5. Use `npm run create-admin:pg` for admin bootstrap.
6. Hubtel: not in product — ignore or schedule separate integration.
