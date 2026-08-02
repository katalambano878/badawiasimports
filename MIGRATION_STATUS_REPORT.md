# Migration Status Report — Badawias Imports

**Tool:** Manual SQL via `psql` into fleet-postgres (no Prisma migrate / Drizzle kit).  
**Folder:** `supabase/migrations/` (historical name; not Supabase-hosted).

## History (repository)

| File | Purpose | Applied staging | Applied prod |
|------|---------|-----------------|--------------|
| `20260209000000_complete_schema.sql` | Baseline schema | Yes (historical) | Yes |
| `20260227000000_contact_submissions.sql` | Contact form | Yes | Yes |
| `20260315000000_admin_rls_products_categories.sql` | Legacy RLS | Archived / RLS off | Archived |
| `20260318000000_full_rls_verification_and_fixes.sql` | Legacy RLS | Archived / RLS off | Archived |
| `20260318120000_store_contact_phone_address.sql` | Settings | Yes | Yes |
| `20260429021000_drop_guest_orders_select.sql` | Legacy RLS | Archived | Archived |
| `20260503140000_relax_orders_insert_policy.sql` | Legacy RLS | Archived | Archived |
| `20260730_payment_callback_events.sql` | Callback ledger | Yes | Yes |
| `20260731_add_sale_price.sql` | `products.sale_price` | Yes | Yes |
| `20260731_product_delete_fks.sql` | Product delete FKs | Yes | Yes |
| **`20260802_database_audit_repairs.sql`** | Audit repairs | **Yes (2026-08-02)** | **Yes (2026-08-02)** |

## Corrective migration `20260802_database_audit_repairs.sql`

**Adds:** `orders.paid_at`, hardened `mark_order_paid`, `payment_attempts`, `sms_message_events`, hot indexes, CHECK constraints.  
**Destructive:** none (no DROP TABLE / DROP COLUMN).  
**Rollback notes:**
```sql
-- Only if absolutely required (loses ledger data):
-- DROP TABLE IF EXISTS sms_message_events;
-- DROP TABLE IF EXISTS payment_attempts;
-- ALTER TABLE orders DROP COLUMN IF EXISTS paid_at;
-- Restore prior mark_order_paid from 20260209 definition if needed.
```

## Pending

None for schema. Application deploy must ship code that writes to new ledgers / health schema checks.

## Deployment order

1. Apply SQL to staging → verify counts/constraints.  
2. Apply SQL to prod.  
3. Deploy app commit that uses ledgers.  
4. Smoke `/api/health` (`schema: ok`).
