# Database Performance Report

## Pool

| Setting | Value |
|---------|-------|
| `PG_POOL_MAX` | default 10 |
| idleTimeoutMillis | 30000 |
| connectionTimeoutMillis | 10000 (added) |
| statement_timeout | 30000 ms (added) |

Single shared Pool in `lib/db/pool.ts` — not created per request.

## Indexes added (2026-08-02)

- `order_items(product_id|variant_id|order_id)`
- `product_images(product_id)`, `product_variants(product_id)`
- `order_status_history(order_id)`, `reviews(user_id|product_id)`
- `return_requests(order_id|user_id)`, `support_*`, `navigation_items(menu_id)`
- `orders(payment_status, created_at)`, `orders(user_id)`, `orders(paid_at)` partial
- `payment_callback_events(processing_status, received_at)`
- Unique/lookup indexes on `payment_attempts`, `sms_message_events`

## Query patterns

| Surface | Notes |
|---------|-------|
| Storefront products API | Cached `s-maxage`; select limited columns |
| Admin products embed | `related(count)` supported in query-builder |
| Order create | Server re-prices from DB |
| Mark paid | `FOR UPDATE` avoids double stock race |

## Residual risks

- Admin dashboards still aggregate client-side over REST (N+1 risk on large catalogs).
- Only 2 products today — load is low; indexes preempt growth.
- Image payload size previously dominant (addressed separately via WebP).

## Measurements

Staging health + storefront product API remain sub-second in prior smoke tests. No EXPLAIN ANALYZE suite automated yet; recommend enabling `pg_stat_statements` on fleet-postgres for ongoing monitoring.
