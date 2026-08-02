-- Corrective migration from full PostgreSQL audit (2026-08-02)
-- Target: badawiasimports_staging (apply to prod after staging verification)
-- Safe / additive: no destructive drops of business data.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) orders.paid_at — first-class paid timestamp (was only in metadata JSON)
-- ---------------------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

UPDATE public.orders
SET paid_at = (metadata->>'payment_verified_at')::timestamptz
WHERE paid_at IS NULL
  AND payment_status = 'paid'
  AND metadata ? 'payment_verified_at'
  AND (metadata->>'payment_verified_at') ~ '^[0-9]{4}-';

UPDATE public.orders
SET paid_at = COALESCE(updated_at, created_at, now())
WHERE paid_at IS NULL
  AND payment_status = 'paid';

CREATE INDEX IF NOT EXISTS orders_paid_at_idx
  ON public.orders (paid_at DESC NULLS LAST)
  WHERE payment_status = 'paid';

-- ---------------------------------------------------------------------------
-- 2) Harden mark_order_paid: row lock, idempotent, set paid_at, never demote
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_order_paid(
  order_ref text,
  moolre_ref text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  updated_order orders;
BEGIN
  SELECT * INTO updated_order
  FROM orders
  WHERE order_number = order_ref
  FOR UPDATE;

  IF updated_order.id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Already paid: merge gateway ref if provided, never re-reduce stock.
  IF updated_order.payment_status = 'paid' THEN
    IF moolre_ref IS NOT NULL AND moolre_ref <> '' THEN
      UPDATE orders
      SET
        metadata = COALESCE(metadata, '{}'::jsonb) ||
                   jsonb_build_object('moolre_reference', moolre_ref),
        paid_at = COALESCE(paid_at, now()),
        updated_at = now()
      WHERE id = updated_order.id
      RETURNING * INTO updated_order;
    END IF;
    RETURN to_jsonb(updated_order);
  END IF;

  UPDATE orders
  SET
    payment_status = 'paid',
    paid_at = now(),
    status = CASE
      WHEN status = 'pending' THEN 'processing'::order_status
      WHEN status = 'awaiting_payment' THEN 'processing'::order_status
      ELSE status
    END,
    payment_transaction_id = COALESCE(payment_transaction_id, moolre_ref),
    metadata = COALESCE(metadata, '{}'::jsonb) ||
               jsonb_build_object(
                 'moolre_reference', moolre_ref,
                 'payment_verified_at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
               ),
    updated_at = now()
  WHERE id = updated_order.id
  RETURNING * INTO updated_order;

  IF (updated_order.metadata->>'stock_reduced') IS NULL THEN
    UPDATE products p
    SET quantity = GREATEST(0, p.quantity - oi.quantity)
    FROM order_items oi
    WHERE oi.order_id = updated_order.id
      AND oi.product_id = p.id;

    UPDATE product_variants pv
    SET quantity = GREATEST(0, pv.quantity - oi.quantity)
    FROM order_items oi
    WHERE oi.order_id = updated_order.id
      AND oi.product_id = pv.product_id
      AND oi.variant_name IS NOT NULL
      AND oi.variant_name = pv.name;

    UPDATE orders
    SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"stock_reduced": true}'::jsonb
    WHERE id = updated_order.id
    RETURNING * INTO updated_order;
  END IF;

  RETURN to_jsonb(updated_order);
END;
$function$;

-- ---------------------------------------------------------------------------
-- 3) payment_attempts — multi-gateway attempt ledger
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  order_number text,
  user_id uuid,
  gateway text NOT NULL,
  internal_reference text NOT NULL,
  gateway_reference text,
  expected_amount numeric NOT NULL,
  amount_paid numeric,
  currency text NOT NULL DEFAULT 'GHS',
  status text NOT NULL DEFAULT 'initiated'
    CHECK (status IN (
      'initiated','processing','successful','failed',
      'cancelled','expired','reversed','refunded'
    )),
  failure_reason text,
  idempotency_key text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS payment_attempts_internal_ref_uidx
  ON public.payment_attempts (internal_reference);

CREATE UNIQUE INDEX IF NOT EXISTS payment_attempts_gateway_ref_uidx
  ON public.payment_attempts (gateway, gateway_reference)
  WHERE gateway_reference IS NOT NULL AND gateway_reference <> '';

CREATE UNIQUE INDEX IF NOT EXISTS payment_attempts_idempotency_uidx
  ON public.payment_attempts (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS payment_attempts_order_id_idx
  ON public.payment_attempts (order_id);

CREATE INDEX IF NOT EXISTS payment_attempts_status_created_idx
  ON public.payment_attempts (status, created_at DESC);

-- ---------------------------------------------------------------------------
-- 4) sms_message_events — prevent duplicate SMS on double callback/verify
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sms_message_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'moolre',
  event_type text NOT NULL,
  related_order_number text,
  related_payment_reference text,
  recipient_hash text,
  provider_message_id text,
  idempotency_key text NOT NULL,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','sent','failed','skipped_duplicate')),
  attempt_count integer NOT NULL DEFAULT 1,
  failure_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS sms_message_events_idempotency_uidx
  ON public.sms_message_events (idempotency_key);

CREATE INDEX IF NOT EXISTS sms_message_events_order_idx
  ON public.sms_message_events (related_order_number);

-- ---------------------------------------------------------------------------
-- 5) Hot-path FK / lookup indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON public.order_items (product_id);
CREATE INDEX IF NOT EXISTS order_items_variant_id_idx ON public.order_items (variant_id);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS product_images_product_id_idx ON public.product_images (product_id);
CREATE INDEX IF NOT EXISTS product_variants_product_id_idx ON public.product_variants (product_id);
CREATE INDEX IF NOT EXISTS order_status_history_order_id_idx ON public.order_status_history (order_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON public.reviews (user_id);
CREATE INDEX IF NOT EXISTS reviews_product_id_idx ON public.reviews (product_id);
CREATE INDEX IF NOT EXISTS return_requests_order_id_idx ON public.return_requests (order_id);
CREATE INDEX IF NOT EXISTS return_requests_user_id_idx ON public.return_requests (user_id);
CREATE INDEX IF NOT EXISTS support_tickets_assigned_to_idx ON public.support_tickets (assigned_to);
CREATE INDEX IF NOT EXISTS support_messages_ticket_id_idx ON public.support_messages (ticket_id);
CREATE INDEX IF NOT EXISTS navigation_items_menu_id_idx ON public.navigation_items (menu_id);
CREATE INDEX IF NOT EXISTS payment_callback_events_status_idx
  ON public.payment_callback_events (processing_status, received_at DESC);

CREATE INDEX IF NOT EXISTS orders_payment_status_created_idx
  ON public.orders (payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_user_id_idx
  ON public.orders (user_id)
  WHERE user_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 6) Financial / inventory check constraints (validate existing data first)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_quantity_nonneg'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_quantity_nonneg CHECK (quantity IS NULL OR quantity >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_total_nonneg'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_total_nonneg CHECK (total >= 0 AND subtotal >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_items_quantity_positive'
  ) THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_quantity_positive CHECK (quantity > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_sale_price_nonneg'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_sale_price_nonneg
      CHECK (sale_price IS NULL OR sale_price >= 0);
  END IF;
END $$;

COMMIT;
