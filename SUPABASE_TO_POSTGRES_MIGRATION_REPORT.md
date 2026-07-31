# Supabase → Plain Postgres Migration Report

**Project:** badawiasimports  
**Shape:** First-party app clients → `/rest|/auth|/storage` shims → `pg` (no `@supabase/*` runtime)  
**Date:** 2026-07-31  

## Feature matrix

| Supabase feature | Replacement | Status |
|------------------|-------------|---------|
| Postgres + PostgREST | `lib/db/query-builder` + `/rest/v1` + ACL | Complete + hardened |
| Auth (GoTrue) | `lib/db/auth.ts` + `/auth/v1` | Complete (password recovery email stubbed) |
| RLS | Application ACL in `lib/db/rest-acl.ts` + API auth | Complete for HTTP shim |
| Storage | Local disk `lib/db/storage.ts` + `/storage/v1` | Complete + write auth |
| Realtime | Not used | N/A |
| Edge functions | Next.js `app/api/*` | Complete |
| RPC | `dbAdmin.rpc` → SQL functions via query builder | Complete; staff RPCs locked |
| Service role client | `lib/db/admin.ts` (`dbAdmin`) in-process PG | Complete |
| Browser client | `lib/app-client.ts` → app origin shims | Complete — `@supabase/*` removed |
| Cron | `/api/cron/payment-reminders` + `CRON_SECRET` | Complete |

## Remaining non-runtime references (intentional)

- Historical SQL: `supabase/migrations/*` (archive only)
- Types archive: `types/supabase.ts` (no runtime import)
- Compat re-export: `lib/db/supabase-compat.ts` → `query-builder`
- Legacy scripts: `scripts/create-admin.mjs`, `scripts/set-admin-role.mjs` (use `create-admin:pg`)
- Env dual-read (remove after Coolify aliases set): `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`

## Schema notes

- `auth.users` retained (bcrypt passwords)
- `profiles.role` drives admin/staff
- `orders.order_number` unique; payment refs stored in metadata / `moolre_ref` RPC arg
- Added `payment_callback_events` (2026-07-30)
- Added `products.sale_price` (2026-07-31)

## Env (preferred)

```
DATABASE_URL=postgresql://…@fleet-postgres:5432/badawiasimports
NEXT_PUBLIC_USE_PLAIN_PG=true
NEXT_PUBLIC_APP_URL=https://www.badawiasimports.com
NEXT_PUBLIC_APP_ANON_KEY=…
APP_SERVICE_KEY=…
AUTH_JWT_SECRET=…
```

Dual-read still accepts `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` during cutover.

## Data integrity

- Prod: 103 orders, 31 users, 2 products (as of 2026-07-30)
- Indexes verified on orders/products/profiles/customers
- No destructive data repairs performed

## Auth / storage / ACL

- Middleware + mark-paid: JWT-only (`jose`), no `@supabase/*`
- REST/Storage no longer grant service-level access to anon
- User-scoped tables force `user_id` / `id` equality on GET/PATCH
- Cookie dual-read: `app-access-token` + legacy `sb-*-auth-token`
