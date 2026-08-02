-- Data integrity probes (read-only)
SELECT 'orders_paid_without_paid_at' AS check_name, count(*)::int AS n
FROM orders WHERE payment_status = 'paid' AND paid_at IS NULL;

SELECT 'orders_duplicate_order_number' AS check_name, count(*)::int AS n
FROM (
  SELECT order_number FROM orders GROUP BY order_number HAVING count(*) > 1
) d;

SELECT 'order_items_orphan_order' AS check_name, count(*)::int AS n
FROM order_items oi
LEFT JOIN orders o ON o.id = oi.order_id
WHERE o.id IS NULL;

SELECT 'order_items_orphan_product' AS check_name, count(*)::int AS n
FROM order_items oi
WHERE oi.product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.id = oi.product_id);

SELECT 'profiles_orphan_auth_user' AS check_name, count(*)::int AS n
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE u.id IS NULL;

SELECT 'auth_users_missing_profile' AS check_name, count(*)::int AS n
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL;

SELECT 'products_duplicate_slug' AS check_name, count(*)::int AS n
FROM (
  SELECT slug FROM products WHERE slug IS NOT NULL GROUP BY slug HAVING count(*) > 1
) d;

SELECT 'negative_product_qty' AS check_name, count(*)::int AS n
FROM products WHERE quantity < 0;

SELECT 'negative_order_total' AS check_name, count(*)::int AS n
FROM orders WHERE total < 0 OR subtotal < 0;

SELECT 'callback_events_total' AS check_name, count(*)::int AS n
FROM payment_callback_events;

SELECT 'callback_failed' AS check_name, count(*)::int AS n
FROM payment_callback_events WHERE processing_status = 'failed';

SELECT 'customers_duplicate_email' AS check_name, count(*)::int AS n
FROM (
  SELECT lower(email) FROM customers WHERE email IS NOT NULL AND email <> ''
  GROUP BY lower(email) HAVING count(*) > 1
) d;

SELECT payment_status, count(*)::int AS n FROM orders GROUP BY 1 ORDER BY 2 DESC;
SELECT status, count(*)::int AS n FROM orders GROUP BY 1 ORDER BY 2 DESC;
SELECT status, count(*)::int AS n FROM products GROUP BY 1 ORDER BY 2 DESC;

-- Index coverage on hot FKs / lookups
SELECT
  'missing_index_hint' AS note,
  t.relname AS table_name,
  a.attname AS column_name
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY (c.conkey)
WHERE c.contype = 'f'
  AND NOT EXISTS (
    SELECT 1
    FROM pg_index i
    WHERE i.indrelid = t.oid
      AND a.attnum = ANY (i.indkey::smallint[])
  )
ORDER BY 2,3;
