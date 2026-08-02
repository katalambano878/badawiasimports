# Database Audit and Repair Report — Badawias Imports

**Date:** 2026-08-02  
**Branch:** `staging/plain-postgres`  
**Databases audited:** `badawiasimports_staging` (primary), `badawiasimports` (prod twin on same host)  
**Host:** fleet-postgres on big-vps (private Docker network; credentials not logged)  
**PostgreSQL:** 16.14  

---

## Baseline (before this audit repair)

| Check | Staging | Production |
|-------|---------|------------|
| Connection | Up | Up |
| Public tables | 32 | 32 |
| `auth.users` | 26 | 31 |
| Products | 2 | 2 |
| Orders | 103 | 106 |
| Order items | 125 | 128 |
| Callback ledger rows | 0 | 0 |
| `@supabase/*` packages | Absent | Absent |
| RLS on public tables | Disabled (app ACL) | Disabled (app ACL) |
| `orders.paid_at` | Missing / incomplete | Missing / incomplete |
| `payment_attempts` | Missing | Missing |
| `sms_message_events` | Missing | Missing |
| Hot FK indexes | Many missing | Many missing |
| Hubtel | Not in codebase | Not in codebase |

Integrity probes: no duplicate order numbers, no orphan order_items/orders, no orphan profiles, no negative totals/qty, no duplicate product slugs.

---

## Architecture found

- **Library:** `pg` Pool + custom PostgREST-compat query builder (`lib/db/query-builder.ts`)
- **Server admin:** `dbAdmin` (`lib/db/admin.ts`)
- **Browser:** `lib/app-client.ts` → `/rest/v1`, `/auth/v1`, `/storage/v1`
- **ACL:** `lib/db/rest-acl.ts` (replaces Supabase RLS for HTTP)
- **Migrations:** SQL files under `supabase/migrations/` (archive folder name; applied manually via `psql`)
- **ORM:** none (no Prisma/Drizzle)

---

## Schema drift repaired

| Object | Code expectation | Before | After |
|--------|------------------|--------|-------|
| `orders.paid_at` | Trusted paid timestamp | Only `metadata.payment_verified_at` | Column + backfill + index |
| `mark_order_paid` | Idempotent, lock, set paid_at | No row lock; no paid_at | Hardened function |
| `payment_attempts` | Multi-attempt ledger | Absent | Created + unique refs |
| `sms_message_events` | SMS idempotency | Absent | Created |
| FK indexes | Hot joins | 19 unindexed FKs flagged | Indexes added |
| Amount checks | Non-negative money/qty | Absent | CHECK constraints |
| Pool timeouts | Stable under load | No statement timeout | 30s statement + 10s connect |

---

## Data integrity

- Paid orders: 36 staging / 36 prod with `paid_at` populated after repair.
- Orphans / duplicates: none found requiring merge.
- Note: some orders are `status=cancelled` while `payment_status=paid` (business/admin choice; not auto-rewritten).

---

## Security / authorization

- RLS off; REST ACL + JWT middleware + server `dbAdmin` for privileged writes.
- Payment amounts sourced from DB totals (never client).
- Callback ledger + late-failure protection already present for Moolre; extended with attempt finalize.
- No credentials written to docs or logs.

---

## Remaining / intentional

- No dedicated Hubtel tables (feature absent).
- Paystack/Stripe/PayPal still verify primarily via redirect/API routes (not full webhook ledger for all gateways).
- Historical Supabase RLS SQL remains in early migration files as archive only.
- Env dual-read of old `NEXT_PUBLIC_SUPABASE_*` names retained for Coolify cutover.

---

## Final readiness

**Ready after listed manual actions** — schema repairs applied to staging+prod; application code for ledgers/health requires deploy of this commit. Staging E2E payment with live Moolre still needs a real checkout test by the operator.
