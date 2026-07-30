-- Safe additive migration: payment callback idempotency ledger
-- Apply on staging/prod with: psql "$DATABASE_URL" -f supabase/migrations/20260730_payment_callback_events.sql

CREATE TABLE IF NOT EXISTS payment_callback_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway text NOT NULL,
  event_type text,
  external_event_id text,
  reference text,
  payload_hash text NOT NULL,
  signature_status text,
  processing_status text NOT NULL DEFAULT 'received',
  attempts integer NOT NULL DEFAULT 1,
  error_message text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS payment_callback_events_gateway_hash_uidx
  ON payment_callback_events (gateway, payload_hash);

CREATE INDEX IF NOT EXISTS payment_callback_events_reference_idx
  ON payment_callback_events (gateway, reference);
