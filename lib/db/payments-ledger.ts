/**
 * Payment attempt + SMS idempotency ledger helpers (plain Postgres).
 * Never throws into payment happy-path — ledger failures are logged only.
 */
import { createHash } from "crypto";
import { isPlainPostgres } from "./mode";

async function q(text: string, params: unknown[] = []) {
  const { query } = await import("./pool");
  return query(text, params);
}

export type PaymentAttemptStatus =
  | "initiated"
  | "processing"
  | "successful"
  | "failed"
  | "cancelled"
  | "expired"
  | "reversed"
  | "refunded";

export async function recordPaymentAttempt(input: {
  orderId?: string | null;
  orderNumber: string;
  userId?: string | null;
  gateway: string;
  internalReference: string;
  gatewayReference?: string | null;
  expectedAmount: number;
  currency?: string;
  status?: PaymentAttemptStatus;
  idempotencyKey?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!isPlainPostgres()) return;
  try {
    await q(
      `INSERT INTO payment_attempts
         (order_id, order_number, user_id, gateway, internal_reference,
          gateway_reference, expected_amount, currency, status, idempotency_key, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
       ON CONFLICT (internal_reference) DO UPDATE SET
         gateway_reference = COALESCE(EXCLUDED.gateway_reference, payment_attempts.gateway_reference),
         status = EXCLUDED.status,
         updated_at = now(),
         metadata = payment_attempts.metadata || EXCLUDED.metadata`,
      [
        input.orderId || null,
        input.orderNumber,
        input.userId || null,
        input.gateway,
        input.internalReference,
        input.gatewayReference || null,
        input.expectedAmount,
        input.currency || "GHS",
        input.status || "initiated",
        input.idempotencyKey || null,
        JSON.stringify(input.metadata || {}),
      ]
    );
  } catch (e) {
    console.warn(
      "[payments-ledger] recordPaymentAttempt skipped:",
      e instanceof Error ? e.message : e
    );
  }
}

export async function finalizePaymentAttempt(input: {
  internalReference: string;
  gateway?: string;
  gatewayReference?: string | null;
  status: PaymentAttemptStatus;
  amountPaid?: number | null;
  failureReason?: string | null;
}): Promise<void> {
  if (!isPlainPostgres()) return;
  try {
    await q(
      `UPDATE payment_attempts
       SET status = $2,
           gateway_reference = COALESCE($3, gateway_reference),
           amount_paid = COALESCE($4, amount_paid),
           failure_reason = COALESCE($5, failure_reason),
           verified_at = CASE WHEN $2 = 'successful' THEN now() ELSE verified_at END,
           updated_at = now()
       WHERE internal_reference = $1
          OR (gateway = COALESCE($6, gateway) AND gateway_reference = $3)`,
      [
        input.internalReference,
        input.status,
        input.gatewayReference || null,
        input.amountPaid ?? null,
        input.failureReason || null,
        input.gateway || null,
      ]
    );
  } catch (e) {
    console.warn(
      "[payments-ledger] finalizePaymentAttempt skipped:",
      e instanceof Error ? e.message : e
    );
  }
}

/** Returns true if this SMS should be sent (first time); false if duplicate. */
export async function claimSmsSend(input: {
  eventType: string;
  orderNumber?: string | null;
  paymentReference?: string | null;
  recipient?: string | null;
  idempotencyKey: string;
}): Promise<boolean> {
  if (!isPlainPostgres()) return true;
  try {
    const recipientHash = input.recipient
      ? createHash("sha256").update(String(input.recipient)).digest("hex").slice(0, 32)
      : null;
    const res = await q(
      `INSERT INTO sms_message_events
         (event_type, related_order_number, related_payment_reference,
          recipient_hash, idempotency_key, status)
       VALUES ($1,$2,$3,$4,$5,'queued')
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING id`,
      [
        input.eventType,
        input.orderNumber || null,
        input.paymentReference || null,
        recipientHash,
        input.idempotencyKey,
      ]
    );
    if (res.rowCount && res.rowCount > 0) return true;
    await q(
      `UPDATE sms_message_events
       SET attempt_count = attempt_count + 1,
           status = 'skipped_duplicate'
       WHERE idempotency_key = $1`,
      [input.idempotencyKey]
    );
    return false;
  } catch (e) {
    console.warn(
      "[payments-ledger] claimSmsSend skipped:",
      e instanceof Error ? e.message : e
    );
    return true;
  }
}

export async function markSmsSent(
  idempotencyKey: string,
  providerMessageId?: string | null,
  failed?: string | null
): Promise<void> {
  if (!isPlainPostgres()) return;
  try {
    if (failed) {
      await q(
        `UPDATE sms_message_events
         SET status = 'failed', failure_reason = $2, sent_at = now()
         WHERE idempotency_key = $1`,
        [idempotencyKey, failed]
      );
    } else {
      await q(
        `UPDATE sms_message_events
         SET status = 'sent', provider_message_id = COALESCE($2, provider_message_id), sent_at = now()
         WHERE idempotency_key = $1`,
        [idempotencyKey, providerMessageId || null]
      );
    }
  } catch (e) {
    console.warn(
      "[payments-ledger] markSmsSent skipped:",
      e instanceof Error ? e.message : e
    );
  }
}
