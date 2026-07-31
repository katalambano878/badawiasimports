# Badawias Imports — Supabase → plain Postgres cutover

**Architecture:** first-party clients → app shims → `pg` (no `@supabase/*`)  
**Repo:** `katalambano878/badawiasimports`  
**Branch:** `staging/plain-postgres`  
**Coolify prod:** `badawiasimports-app` (`ut4qsmo8hekw3zfdv1c8v61r`)  
**Coolify staging:** `badawiasimports-staging` (`si8z92cu0ewqtbtc78ac3tdn`)  
**Production:** https://www.badawiasimports.com  
**DB:** `fleet-postgres` / `badawiasimports`

## Env (preferred)

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | `postgresql://…@fleet-postgres:5432/badawiasimports` |
| `NEXT_PUBLIC_USE_PLAIN_PG` | `true` |
| `NEXT_PUBLIC_APP_URL` | `https://www.badawiasimports.com` |
| `NEXT_PUBLIC_APP_ANON_KEY` | public anon / app key |
| `APP_SERVICE_KEY` | server service key |
| `AUTH_JWT_SECRET` | JWT signing secret |

Dual-read still accepts `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` until Coolify is updated.

## Code map

| Role | Module |
|------|--------|
| Browser client | `lib/app-client.ts` (`db`) |
| Server admin | `lib/db/admin.ts` (`dbAdmin`) |
| Query builder | `lib/db/query-builder.ts` |
| Env dual-read | `lib/env.ts` |
| HTTP ACL | `lib/db/rest-acl.ts` + `lib/db/rest-auth.ts` |
| Shims | `/rest/v1`, `/auth/v1`, `/storage/v1` |

## Hardening notes (Jul 2026)

- [x] REST + storage ACL
- [x] `payment_callback_events` + Paystack amount verify + fetch timeouts
- [x] Image WebP resize + compression
- [x] Runtime `@supabase/*` packages removed; first-party clients
- [x] Middleware JWT-only admin gate
- [x] See root `FULL_SYSTEM_AUDIT.md` / `PAYMENT_AND_CALLBACK_AUDIT.md`

## Verify

```bash
BASE=https://www.badawiasimports.com
curl -s "$BASE/api/health"
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/"
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/shop"
npm ls @supabase/supabase-js   # should fail / absent
```
