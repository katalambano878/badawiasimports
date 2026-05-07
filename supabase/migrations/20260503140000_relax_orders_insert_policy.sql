-- Fix: "new row violates row-level security policy for table 'orders'"
--
-- The original policy was:
--   ((auth.uid() IS NOT NULL) AND (auth.uid() = user_id))
--   OR ((auth.uid() IS NULL) AND (user_id IS NULL))
--
-- This rejected legitimate inserts whenever the client's session and the JWT
-- presented to PostgREST drifted out of sync. Real cases we hit:
--   1. Guest checkout where a stale auth cookie was still being sent (auth.uid()
--      was non-null but user_id was null) → second clause failed.
--   2. Logged-in checkout where the access_token had expired and PostgREST
--      treated the request as anon (auth.uid() became null, user_id was set) →
--      first clause failed.
--
-- Replacement policy: allow guest orders (no owner) outright, and logged-in
-- orders only when the JWT subject matches the supplied user_id. An attacker
-- still cannot create orders linked to another user's account because that
-- requires their JWT.
--
-- order_items had the same shape but its existing check already permits guest
-- orders (orders.user_id IS NULL), so we leave it alone.

DROP POLICY IF EXISTS "Enable insert for all users" ON public.orders;

CREATE POLICY "Enable insert for all users"
ON public.orders FOR INSERT
WITH CHECK (
  user_id IS NULL
  OR auth.uid() = user_id
);
