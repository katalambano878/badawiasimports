-- P0-4 fix: Stop leaking every guest order's PII (email, phone, address) via the
-- public REST API. The two policies dropped here let anyone with the anon key
-- list / read all orders where user_id IS NULL.
--
-- Replacement access path: app/api/orders/lookup (POST, server-side, service_role)
-- which requires both the order_number AND a per-order lookup_token (UUID stored
-- in orders.metadata.lookup_token). Tokens are generated at checkout and embedded
-- in the redirect URL the customer is sent to after creating an order.
--
-- Logged-in users still read their own orders via "Users view own orders"
-- (auth.uid() = user_id). Admins/staff still read everything via
-- "Staff manage all orders" (is_admin_or_staff()).

DROP POLICY IF EXISTS "Enable select for guest orders" ON public.orders;
DROP POLICY IF EXISTS "Enable select for guest order items" ON public.order_items;
