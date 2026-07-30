# Payment and Callback Audit

**Date:** 2026-07-30  
**Store:** Badawias Imports  

## Gateways present

| Gateway | In codebase | Notes |
|---------|-------------|-------|
| Moolre | Yes | Primary MoMo |
| Paystack | Yes | Initialize + verify |
| Stripe | Yes | Checkout + success |
| PayPal | Yes | Create + capture |
| Hubtel | **No** | Not implemented |

---

## Moolre

| Step | Route | Status |
|------|-------|--------|
| Initiation | `POST /api/payment/moolre` | Server loads order total |
| Redirect | Embed / pay page `/pay/[orderId]` | OK |
| Callback | `POST /api/payment/moolre/callback` | Amount match + optional secret + status API |
| Verify | `POST /api/payment/moolre/verify` | Post-redirect |
| Duplicate protection | Idempotent if `payment_status=paid` | OK |
| Late failure | Does **not** overwrite paid | Fixed |
| Event ledger | `payment_callback_events` | Added |
| Timeouts | Status API 12s | Fixed |

**Signature model:** Optional `MOOLRE_CALLBACK_SECRET` if present; always amount-match + order lookup; Moolre status API advisory/defense-in-depth.

---

## Paystack

| Step | Route | Status |
|------|-------|--------|
| Initiation | `POST /api/payment/paystack` | Amount from DB → pesewas |
| Redirect | Paystack hosted → `/order-success` | OK |
| Callback/webhook | **No dedicated webhook** | Gap |
| Verify | `POST /api/payment/paystack/verify` | Amount + currency + timeout |
| Duplicate protection | Skip if already paid | OK |

**Manual action:** Register Paystack webhook to a future `/api/payment/paystack/webhook` (not yet built) or keep verify-on-return + admin reconcile.

---

## Stripe

| Step | Route | Status |
|------|-------|--------|
| Initiation | `POST /api/payment/stripe` | Server session |
| Success | `GET /api/payment/stripe/success` | Marks paid via RPC |
| Webhook | Not present | Relies on success redirect |

---

## PayPal

| Step | Route | Status |
|------|-------|--------|
| Create | `POST /api/payment/paypal` | Server |
| Capture | `GET /api/payment/paypal/capture` | Marks paid |

---

## Shared payment rules

- Trusted amount always from `orders.total` (server)
- `mark_order_paid` RPC only via service/admin paths (REST ACL blocks anon)
- Admin cash/POS: `POST /api/admin/orders/mark-paid` (JWT staff/admin)
- Internal payment statuses used: `pending`, `paid`, `failed` (order `status` separate)

## Test results (this session)

| Test | Result |
|------|--------|
| Live successful MoMo payment | Not run (no sandbox charge authorized) |
| Spoof `mark_order_paid` via REST (pre-fix) | Succeeded with 200 — **critical** |
| Spoof after ACL deploy | Requires redeploy to verify in prod |
| Amount mismatch Paystack | Code path added; unit not executed |
| Duplicate Moolre callback | Code path: early return when paid |
| Callback GET health | Exists (`message: ready`) |

## Reconciliation

- Cron: `/api/cron/payment-reminders` (Bearer `CRON_SECRET`) for unpaid reminders
- Admin can mark paid via POS/orders UI → secured API
- Recommended: pending-payment admin report (not built this pass)
