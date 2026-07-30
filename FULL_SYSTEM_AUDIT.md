# Badawias Imports — Full System Audit

**Date:** 2026-07-30  
**Branch:** `staging/plain-postgres`  
**Architecture:** Shape A — `@supabase/supabase-js` browser client → self-hosted `/rest/v1`, `/auth/v1`, `/storage/v1` → `pg` pool  
**Staging:** https://badawiasimports-staging.169-58-8-203.sslip.io  
**Production:** https://www.badawiasimports.com  

---

## Baseline (before repairs)

| Check | Result |
|-------|--------|
| Git branch | `staging/plain-postgres` synced with origin |
| Coolify prod | `badawiasimports-app` healthy, branch `staging/plain-postgres` |
| Coolify staging | `badawiasimports-staging` healthy |
| `NEXT_PUBLIC_USE_PLAIN_PG` | `true` |
| `DATABASE_URL` | set (fleet-postgres / `badawiasimports`) |
| Staging `/` `/shop` `/categories` `/checkout` `/admin/login` | HTTP 200 (~50–200ms) |
| Prod `/` `/shop` `/api/storefront/products` | HTTP 200 |
| DB counts | 2 products, 103 orders, 31 users, 31 public tables |
| Unauthenticated `POST /rest/v1/rpc/mark_order_paid` | **200 (CRITICAL)** |
| Unauthenticated `PATCH /rest/v1/orders` | **200 (CRITICAL)** |
| Hubtel integration | **Not present in codebase** |
| Local `node_modules` | absent (build not run locally this session) |
| `next.config` | `ignoreBuildErrors` / `ignoreDuringBuilds` still true |

---

## Architecture summary

```
Browser (@supabase/ssr)
  → NEXT_PUBLIC_SUPABASE_URL (app origin)
    → /rest/v1 + /auth/v1 + /storage/v1  (ACL-gated)
    → lib/db/supabase-compat → pg Pool

Server APIs
  → supabaseAdmin → createPgClient() when DATABASE_URL set
```

- **ORM:** none — custom PostgREST-compat over `pg`
- **Auth:** JWT (jose + bcrypt) against `auth.users` / `profiles.role`
- **Storage:** local disk via `lib/db/storage.ts`
- **Payments:** Moolre, Paystack, Stripe, PayPal (no Hubtel)
- **SMS:** Moolre VAS
- **Email:** Resend

---

## Route inventory (summary)

| Area | Count | Notes |
|------|------:|-------|
| Pages (`page.tsx`) | 57 | 50 client / 7 server |
| API routes | 18 | + `/api/health` |
| REST/Auth/Storage shims | 6 | ACL added |
| Admin pages | 18 | Still browser→REST (staff JWT required for writes) |

See explore inventory in session notes for full URL list. Key storefront paths: `/`, `/shop`, `/categories`, `/product/[slug]`, `/cart`, `/checkout`, `/pay/[orderId]`, `/order-success`, `/account`, `/auth/*`, legal/help pages. Admin: `/admin/*`.

---

## Database architecture

- Host: `fleet-postgres`
- DBs: `badawiasimports`, `badawiasimports_staging`
- Indexes present on `orders.order_number`, `orders.user_id`, `products.slug/status`, `profiles.email/role`, `customers.email`
- New table: `payment_callback_events` (2026-07-30 migration applied to both DBs)

---

## Authentication architecture

- Login/signup via `/auth/v1` shim → `lib/db/auth.ts`
- Admin middleware: JWT role in `app_metadata` (`admin`/`staff`) when plain PG
- Mark-paid API: JWT + profile role (plain PG path) or SSR session (legacy)
- REST ACL: anon public reads; user-scoped GETs; staff for admin tables/RPCs/storage writes

---

## Payment / SMS architecture

| Gateway | Initiate | Verify | Callback | Amount from server |
|---------|----------|--------|----------|--------------------|
| Moolre | `/api/payment/moolre` | `/api/payment/moolre/verify` | `/api/payment/moolre/callback` | Yes |
| Paystack | `/api/payment/paystack` | `/api/payment/paystack/verify` | Browser return only (no dedicated webhook) | Yes (+ verify amount check) |
| Stripe | `/api/payment/stripe` | `/api/payment/stripe/success` | Redirect success | Yes |
| PayPal | `/api/payment/paypal` | `/api/payment/paypal/capture` | Return capture | Yes |
| Hubtel | — | — | — | N/A |

SMS: `lib/notifications.ts` → Moolre `open/sms/send` with 12s timeout.

---

## Critical findings & root causes

1. **Open `/rest/v1` after RLS removal** — any caller could RPC `mark_order_paid` or PATCH orders.
2. **Env flag split** — middleware used `NEXT_PUBLIC_USE_PLAIN_PG` while data layer used `DATABASE_URL`.
3. **Server code still used browser supabase client** — categories RSC + notifications order_items fetch.
4. **Mark-paid auth** depended on `@supabase/ssr` cookie refresh against shims — fragile under plain PG.
5. **Late failure callbacks** could overwrite `paid` → `failed`.
6. **Paystack verify** lacked amount/currency comparison.
7. **External fetch** calls lacked timeouts (freeze risk).
8. **Admin bootstrap scripts** still targeted hosted Supabase Admin API only.

---

## Fixes applied (this audit)

- REST table + RPC ACL (`lib/db/rest-auth.ts`, `lib/db/rest-acl.ts`)
- Storage write auth
- Middleware plain-PG detection unified
- Mark-paid JWT auth for plain PG
- Categories + notifications → `supabaseAdmin`
- Moolre callback: no overwrite of paid; event ledger writes
- Paystack verify: amount + currency checks + timeout
- Moolre status + SMS timeouts
- `/api/health`
- `scripts/create-admin-pg.mjs`
- `.env.example`
- `payment_callback_events` migration applied

---

## Remaining risks

| Risk | Severity | Notes |
|------|----------|-------|
| Admin UI still mutates via browser REST | Medium | Mitigated by staff JWT ACL; prefer `/api/admin/*` long-term |
| Shape A keeps `@supabase/*` packages | Low | Intentional; full SDK removal is a future phase |
| Paystack has no server webhook route | Medium | Relies on verify after redirect + manual reconcile |
| Hubtel not implemented | Info | Prompt assumed Hubtel; not in this product |
| `ignoreBuildErrors: true` | Medium | Masks TS debt |
| Password recovery email stubbed | Medium | `/auth/v1` returns success without sending mail |
| Only 2 products in prod DB | Info | Data/content issue, not migration breakage |
| Local uncommitted hardening files (invoice/error/sw) | Low | Appear as modified (possible CRLF); review before discard |

---

## Performance findings

- Staging HTML routes: ~50–200ms TTFB (healthy)
- Storefront APIs cached via `s-maxage=900`
- Indexes for order/product lookups already present
- Freezing risk addressed via fetch timeouts on Moolre/Paystack/SMS
- Remaining: many client components → large JS; consider gradual RSC for shop

---

## Security findings

| Finding | Status |
|---------|--------|
| Open `mark_order_paid` RPC | **Fixed** (staff/service only) |
| Open order PATCH | **Fixed** |
| Open storage upload | **Fixed** (staff only) |
| Public catalog GET | Allowed by design |
| Service-role key in browser | Not present (anon only) |
| Payment amount from client | Server totals used; Paystack verify now compares |

---

## Page audit status

| Bucket | Status |
|--------|--------|
| Public storefront (home, shop, categories, cart, checkout, contact, legal) | Working (HTTP 200) |
| Auth pages | Working (HTTP 200; full login not E2E'd with credentials) |
| Account / invoice | Requires authenticated session — code path uses `user_id` scope |
| Pay / order-success | Working shell; live payment not exercised |
| Admin pages | Login page 200; dashboard requires admin JWT |
| Blog | Placeholder static content |

**Totals:** 57 discovered · majority HTTP-ok initially · security-critical routes repaired · live payment/SMS journeys require credentials (manual)
