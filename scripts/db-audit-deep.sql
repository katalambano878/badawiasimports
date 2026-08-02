-- Exact counts
SELECT 'staging_products' AS k, count(*)::int AS n FROM products
UNION ALL SELECT 'staging_orders', count(*)::int FROM orders
UNION ALL SELECT 'staging_order_items', count(*)::int FROM order_items
UNION ALL SELECT 'staging_users', count(*)::int FROM auth.users
UNION ALL SELECT 'staging_profiles', count(*)::int FROM profiles
UNION ALL SELECT 'staging_customers', count(*)::int FROM customers
UNION ALL SELECT 'staging_categories', count(*)::int FROM categories
UNION ALL SELECT 'staging_callbacks', count(*)::int FROM payment_callback_events;

-- orders columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema='public' AND table_name='orders'
ORDER BY ordinal_position;

-- products has sale_price?
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='products' AND column_name IN ('sale_price','status','quantity');

-- mark_order_paid definition excerpt
SELECT pg_get_functiondef(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname='public' AND p.proname='mark_order_paid';

-- unique constraints on orders/products/customers
SELECT conrelid::regclass, conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE contype IN ('u','p')
  AND conrelid::regclass::text IN ('orders','products','customers','profiles','payment_callback_events')
ORDER BY 1,2;

-- RLS enabled?
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname='public' AND c.relkind='r'
ORDER BY 1;

-- paid orders sample metadata keys
SELECT id, order_number, payment_status, payment_method,
       (metadata ? 'moolre_ref') AS has_moolre_ref,
       (metadata ? 'paystack_ref') AS has_paystack_ref
FROM orders
WHERE payment_status='paid'
LIMIT 5;
