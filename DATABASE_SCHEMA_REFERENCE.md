# Database Schema Reference — Badawias Imports

**Engine:** PostgreSQL 16.14  
**Schemas in use:** `public`, `auth` (+ `extensions`)  

## Auth

### `auth.users`
Purpose: password login (bcrypt), JWT subject.  
Key columns: `id uuid PK`, `email`, `encrypted_password`, `raw_user_meta_data`, `email_confirmed_at`, timestamps.  
Related: `profiles.id = auth.users.id`.

### `public.profiles`
Purpose: role + display profile.  
PK: `id` → `auth.users`.  
Unique: `email`.  
Role enum: `admin` \| `staff` \| `customer`.

## Catalog

### `products`
PK `id`. Unique `slug`, `sku`.  
Money: `price numeric`, `sale_price numeric`, `compare_at_price`.  
Stock: `quantity int >= 0`. Status enum `product_status`.  
FK: `category_id → categories`.

### `product_images` / `product_variants`
FK `product_id → products` **ON DELETE CASCADE**.

### `categories`
Catalog grouping; status `category_status`.

## Commerce

### `orders`
PK `id`. Unique `order_number`.  
Money: `subtotal`, `total` (>= 0), tax/shipping/discount.  
Status enums: `order_status`, `payment_status`.  
JSON: `shipping_address`, `billing_address`, `metadata`.  
Payment fields: `payment_method`, `payment_provider`, `payment_transaction_id`, **`paid_at`**.  
Indexes: `order_number`, `(payment_status, created_at)`, `user_id`, `paid_at` (partial).

### `order_items`
FK `order_id → orders`.  
`product_id` / `variant_id` **ON DELETE SET NULL** (history preserved).  
`quantity > 0`. Snapshot fields: `product_name`, unit/total prices.

### `order_status_history`
Audit trail of status changes.

### `customers`
Unique `email`. Aggregated from orders via `upsert_customer_from_order`.

### `cart_items` / `wishlist_items`
User-scoped; product FK **ON DELETE CASCADE**.

### `coupons`, `reviews`, `review_images`, `return_requests`, `return_items`
Support merchandising / post-purchase flows.

## Payments & SMS (audit additions)

### `payment_callback_events`
Idempotent callback ledger. Unique `(gateway, payload_hash)`.

### `payment_attempts`
One row per gateway attempt. Unique `internal_reference`; unique `(gateway, gateway_reference)` when present.

### `sms_message_events`
SMS send ledger. Unique `idempotency_key`. Recipient stored as hash only.

## CMS / storefront content

`banners`, `blog_posts`, `pages`, `cms_content`, `navigation_menus`, `navigation_items`, `site_settings`, `store_settings`, `store_modules`, `notifications`, `contact_submissions`, `addresses`, `support_tickets`, `support_messages`, `audit_logs`.

## Key RPCs

| Function | Purpose |
|----------|---------|
| `mark_order_paid(order_ref, moolre_ref)` | Idempotent pay + stock reduce + `paid_at` |
| `update_customer_stats` | Customer aggregates |
| `upsert_customer_from_order` | Customer upsert |
| `reduce_stock_on_order` | Stock helper |
| `is_admin_or_staff` | Role helper |
| `get_all_customer_emails` / `phones` | Admin exports |

## Related app surfaces

| Area | Tables |
|------|--------|
| Shop / product pages | products, product_images, categories, reviews |
| Checkout / orders API | products, orders, order_items |
| Admin products | products, variants, images |
| Admin orders | orders, order_items, mark_order_paid |
| Moolre pay | orders, payment_attempts, payment_callback_events, sms_message_events |
| Auth | auth.users, profiles |
