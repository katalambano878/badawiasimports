# Badawias Imports — Supabase → plain Postgres cutover

**Shape:** A — shimmed `@supabase/supabase-js` → plain PG  
**Repo:** `katalambano878/badawiasimports`  
**Branch:** `staging/plain-postgres`  
**Coolify prod:** `badawiasimports-app` (`ut4qsmo8hekw3zfdv1c8v61r`)  
**Coolify staging:** `badawiasimports-staging` (`si8z92cu0ewqtbtc78ac3tdn`)  
**Production:** https://www.badawiasimports.com  
**DB:** `fleet-postgres` / `badawiasimports`

## Env cutover trio

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | `postgresql://…@fleet-postgres:5432/badawiasimports` |
| `NEXT_PUBLIC_USE_PLAIN_PG` | `true` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://www.badawiasimports.com` |

## Hardening notes (Jul 2026)

- [x] `images.unoptimized`; drop Supabase/placeholder remotePatterns
- [x] Service worker `sw-v2.5-badawias`
- [x] `lib/format-money.ts` + error boundaries
- [x] Payment/orders/cron/admin mark-paid → `supabaseAdmin`
- [x] Order history Track / Reorder / Invoice / Help; hide Bulk Restock stub
- [x] `/rest/v1` + `/rest/v1/rpc` + storage writes ACL (`lib/db/rest-acl.ts`)
- [x] `payment_callback_events` ledger + Paystack amount verify + fetch timeouts
- [x] See root `FULL_SYSTEM_AUDIT.md` / `PAYMENT_AND_CALLBACK_AUDIT.md`

## Verify

```bash
BASE=https://www.badawiasimports.com
ssh big-vps "sudo docker ps --format '{{.Image}} {{.Status}}' | grep ut4qsmo"
curl -s "$BASE/service-worker.js" | head -n 3
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/"
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/shop"
```
