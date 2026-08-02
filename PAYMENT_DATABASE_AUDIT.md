# Payment Database Audit

## Shared model

- **Order of truth:** `orders.total` / `orders.currency` / `orders.payment_status`
- **Paid timestamp:** `orders.paid_at` (+ metadata `payment_verified_at` for history)
- **Mark paid:** RPC `mark_order_paid` (row lock, idempotent, stock once)
- **Attempts:** `payment_attempts`
- **Callbacks:** `payment_callback_events`
- **SMS after pay:** `sms_message_events` idempotency

## Moolre

| Area | Status |
|------|--------|
| Initiate | Writes `payment_attempts` (`initiated`) + order metadata `moolre_externalref` |
| Callback | Amount check, optional secret, status API advisory, `mark_order_paid`, finalize attempt, ledger event |
| Duplicate callback | `payment_status=paid` short-circuit + payload_hash unique |
| Late failure | Ignored when already paid |
| SMS | Order confirmation SMS claimed via idempotency key |

## Hubtel

**Not implemented** in this repository. No tables/routes required.

## Paystack

| Area | Status |
|------|--------|
| Initiate | Records `payment_attempts`; amount from DB (pesewas) |
| Verify | Server verify route compares amount/currency; `mark_order_paid` |
| Webhook table | Uses attempt + order; no dedicated Paystack webhook route yet |
| Risk | Relies on browser return + verify — document as medium residual |

## Stripe / PayPal

- Initiate/capture/success routes update orders via `mark_order_paid`.
- Attempt ledger helper available; wire-in for Stripe/PayPal initiate can follow same pattern as Paystack/Moolre (Moolre+Paystack done this audit).

## Integrity rules

- Never trust client amount.
- Never demote `paid` → `failed` from delayed callbacks.
- Unique order_number; unique attempt internal_reference.
- Callback unique `(gateway, payload_hash)`.
