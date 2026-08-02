-- Schema smoke tests (expect all assertions to return ok=true)
SELECT to_regclass('public.orders') IS NOT NULL AS orders_ok;
SELECT to_regclass('public.payment_attempts') IS NOT NULL AS payment_attempts_ok;
SELECT to_regclass('public.sms_message_events') IS NOT NULL AS sms_ok;
SELECT to_regclass('public.payment_callback_events') IS NOT NULL AS callbacks_ok;
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_name='orders' AND column_name='paid_at'
) AS paid_at_ok;
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_name='products' AND column_name='sale_price'
) AS sale_price_ok;
SELECT COUNT(*) = 0 AS no_dup_order_numbers
FROM (SELECT order_number FROM orders GROUP BY 1 HAVING count(*)>1) d;
SELECT COUNT(*) FILTER (WHERE payment_status='paid' AND paid_at IS NULL) = 0 AS all_paid_have_paid_at
FROM orders;
