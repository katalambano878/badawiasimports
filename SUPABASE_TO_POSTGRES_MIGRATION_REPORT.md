# Supabase → Plain Postgres Migration Report

**Project:** badawiasimports  
**Shape:** A (shimmed Supabase client)  
**Date:** 2026-07-30  

## Feature matrix

| Supabase feature | Replacement | Status |
|------------------|-------------|---------|
| Postgres + PostgREST | `lib/db/supabase-compat` + `/rest/v1` + ACL | Complete + hardened |
| Auth (GoTrue) | `lib/db/auth.ts` + `/auth/v1` | Complete (password recovery email stubbed) |
| RLS | Application ACL in `lib/db/rest-acl.ts` + API auth | Complete for HTTP shim |
| Storage | Local disk `lib/db/storage.ts` + `/storage/v1` | Complete + write auth |
| Realtime | Not used | N/A |
| Edge functions | Next.js `app/api/*` | Complete |
| RPC | `client.rpc` → SQL functions via compat | Complete; staff RPCs locked |
| Service role client | `lib/supabase-admin.ts` → in-process PG | Complete |
| Browser client | `@supabase/ssr` → app origin | Intentional Shape A |
| Cron | `/api/cron/payment-reminders` + `CRON_SECRET` | Complete |

## Remaining Supabase references

- Packages: `@supabase/ssr`, `@supabase/supabase-js` (required for Shape A)
- Wrappers: `lib/supabase.ts`, `lib/supabase-server.ts`, `lib/supabase-admin.ts`
- Types: `types/supabase.ts`
- Historical SQL: `supabase/migrations/*`
- Legacy scripts: `scripts/create-admin.mjs`, `scripts/set-admin-role.mjs` (use `create-admin:pg` instead)
- Env names kept for compatibility: `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`

## Schema notes

- `auth.users` retained (bcrypt passwords)
- `profiles.role` drives admin/staff
- `orders.order_number` unique; payment refs stored in metadata / `moolre_ref` RPC arg
- Added `payment_callback_events` (2026-07-30)

## Env cutover trio (required)

```
DATABASE_URL=postgresql://…@fleet-postgres:5432/badawiasimports
NEXT_PUBLIC_USE_PLAIN_PG=true
NEXT_PUBLIC_SUPABASE_URL=https://www.badawiasimports.com
```

Plus `AUTH_JWT_SECRET` (or `SUPABASE_JWT_SECRET`) and anon/service keys for the browser/shim ACL.

## Data integrity

- Prod: 103 orders, 31 users, 2 products
- Indexes verified on orders/products/profiles/customers
- No destructive data repairs performed

## Auth / storage / RLS changes

- Middleware + mark-paid use local JWT verification in plain PG mode
- REST/Storage no longer grant service-level access to anon
- User-scoped tables force `user_id` / `id` equality on GET/PATCH
