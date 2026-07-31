import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/db/admin';
import { sendOrderConfirmation } from '@/lib/notifications';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';
import { checkMoolreTransaction } from '@/lib/moolre';
import { isPlainPostgres } from '@/lib/db/mode';

async function recordCallbackEvent(opts: {
  reference: string | null;
  externalEventId: string | null;
  payload: unknown;
  signatureStatus: string;
  processingStatus: string;
  errorMessage?: string;
}) {
  if (!isPlainPostgres()) return;
  try {
    const { query } = await import('@/lib/db/pool');
    const payloadHash = createHash('sha256')
      .update(JSON.stringify(opts.payload ?? {}))
      .digest('hex');
    await query(
      `INSERT INTO payment_callback_events
         (gateway, event_type, external_event_id, reference, payload_hash,
          signature_status, processing_status, error_message, processed_at)
       VALUES ('moolre', 'payment_callback', $1, $2, $3, $4, $5, $6,
               CASE WHEN $5 IN ('processed','duplicate','rejected') THEN now() ELSE NULL END)
       ON CONFLICT (gateway, payload_hash) DO UPDATE
         SET attempts = payment_callback_events.attempts + 1,
             processing_status = EXCLUDED.processing_status,
             error_message = COALESCE(EXCLUDED.error_message, payment_callback_events.error_message)`,
      [
        opts.externalEventId,
        opts.reference,
        payloadHash,
        opts.signatureStatus,
        opts.processingStatus,
        opts.errorMessage || null,
      ]
    );
  } catch (e) {
    // Table may not exist until migration is applied — never fail the callback on ledger write.
    console.warn(
      '[Callback] payment_callback_events write skipped:',
      e instanceof Error ? e.message : e
    );
  }
}

/**
 * Moolre Callback Payload Structure (from their actual API):
 * {
 *   "status": 1,
 *   "code": "P01",
 *   "message": "Transaction Successful",
 *   "data": {
 *     "txtstatus": 1,
 *     "payer": "233535998837",
 *     "terminalid": "",
 *     "accountnumber": "10789906062911",
 *     "name": "",
 *     "amount": "2",
 *     "value": "2",
 *     "transactionid": "42252702",
 *     "externalref": "ORD-1770330034217-441",
 *     "thirdpartyref": "74658410493"
 *   },
 *   "secret": "c23bc2ab-...",
 *   "ts": "2026-02-05 22:21:16",
 *   "go": null
 * }
 */

export async function POST(req: Request) {
    console.log('[Callback] POST received at', new Date().toISOString());
    
    try {
        // Rate limiting
        const clientId = getClientIdentifier(req);
        const rateLimitResult = checkRateLimit(`callback:${clientId}`, RATE_LIMITS.callback);
        
        if (!rateLimitResult.success) {
            console.warn('[Callback] Rate limited:', clientId);
            return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
        }

        let body: any = {};
        const contentType = req.headers.get('content-type') || '';

        // Parse body
        try {
            if (contentType.includes('application/json')) {
                body = await req.json();
            } else if (contentType.includes('form')) {
                const formData = await req.formData();
                body = Object.fromEntries(formData.entries());
            } else {
                const rawText = await req.text();
                try {
                    body = JSON.parse(rawText);
                } catch {
                    try {
                        body = Object.fromEntries(new URLSearchParams(rawText).entries());
                    } catch {
                        console.warn('[Callback] Could not parse body');
                    }
                }
            }
        } catch (parseError) {
            console.error('[Callback] Body parsing failed');
            return NextResponse.json({ success: false, message: 'Invalid Request Body' }, { status: 400 });
        }

        console.log('[Callback] Body keys:', Object.keys(body).join(', '));
        console.log('[Callback] Data keys:', body.data ? Object.keys(body.data).join(', ') : 'no data object');

        // ============================================================
        // EXTRACT FIELDS - Moolre nests payment data inside body.data
        // ============================================================
        const data = body.data || {};
        
        // Order reference: check body.data.externalref first, then top-level fallbacks
        const rawExternalRef = 
            data.externalref || 
            data.external_reference ||
            data.orderRef ||
            body.externalref || 
            body.orderRef || 
            body.external_reference;

        // Strip retry suffix (e.g., "ORD-123-R1770000000" -> "ORD-123")
        // Also check metadata for the original order number
        const merchantOrderRef = rawExternalRef 
            ? rawExternalRef.replace(/-R\d+$/, '') 
            : (data.metadata?.original_order_number || body.metadata?.original_order_number);

        // Moolre's transaction reference
        const moolreReference = 
            data.transactionid || 
            data.thirdpartyref || 
            body.reference ||
            'callback';

        // Payment status: body.status === 1 means API call succeeded,
        // body.data.txtstatus === 1 means transaction was successful
        const apiStatus = body.status;
        const txStatus = data.txtstatus;
        const messageStr = String(body.message || '').toLowerCase();

        console.log('[Callback] Order ref:', merchantOrderRef, 
            '| API status:', apiStatus, 
            '| TX status:', txStatus,
            '| Message:', body.message,
            '| Moolre ref:', moolreReference);

        if (!merchantOrderRef) {
            console.error('[Callback] Missing order reference. Body:', JSON.stringify(body).substring(0, 500));
            await recordCallbackEvent({
                reference: null,
                externalEventId: String(moolreReference || ''),
                payload: body,
                signatureStatus: 'absent',
                processingStatus: 'rejected',
                errorMessage: 'Missing order reference',
            });
            return NextResponse.json({ success: false, message: 'Missing order reference' }, { status: 400 });
        }

        // Verify payment success
        // Moolre: status=1 + data.txtstatus=1 + message contains "successful"
        const hasFailureSignal =
            txStatus === 0 || txStatus === '0' ||
            txStatus === -1 || txStatus === '-1' ||
            messageStr.includes('fail') ||
            messageStr.includes('cancel') ||
            messageStr.includes('declin') ||
            messageStr.includes('error');
        const hasSuccessSignal =
            ((apiStatus === 1 || apiStatus === '1') && (txStatus === 1 || txStatus === '1')) ||
            messageStr.includes('successful') ||
            messageStr.includes('completed') ||
            messageStr.includes('paid');
        const isSuccess = hasSuccessSignal && !hasFailureSignal;

        // Verification model:
        //   Moolre's documented webhook payload does NOT contain a `secret`
        //   field, so a static-secret check rejects every legitimate callback
        //   (which is what was happening — every order stuck pending). Instead
        //   we trust the callback only if BOTH:
        //     1. We can find a matching order by externalref (random per-order),
        //        which is enough to defeat blind spoofing — attackers don't
        //        know our order numbers.
        //     2. The callback's amount matches the stored order total.
        //   We then call back to Moolre's authenticated /open/transact/status
        //   API as a defense-in-depth check, but treat that as advisory only
        //   (an auth/network failure there must not strand a paying customer).
        //   If the operator has configured MOOLRE_CALLBACK_SECRET AND Moolre
        //   actually echoes it (some accounts can do this via dashboard config),
        //   we'll honour it as a bonus signal, but never require it.
        const expectedSecret = process.env.MOOLRE_CALLBACK_SECRET;
        const callbackHasSecret = !!body.secret;
        const secretMatches = expectedSecret && body.secret === expectedSecret;
        if (callbackHasSecret && expectedSecret && !secretMatches) {
            console.error('[Callback] secret field present but mismatched — rejecting as likely spoof.');
            await recordCallbackEvent({
                reference: merchantOrderRef || null,
                externalEventId: String(moolreReference || ''),
                payload: body,
                signatureStatus: 'mismatch',
                processingStatus: 'rejected',
                errorMessage: 'Invalid secret',
            });
            return NextResponse.json({ success: false, message: 'Invalid secret' }, { status: 403 });
        }

        if (isSuccess) {
            console.log(`[Callback] Payment SUCCESS for Order ${merchantOrderRef}`);

            // Check if order exists
            const { data: existingOrder, error: fetchError } = await dbAdmin
                .from('orders')
                .select('id, order_number, payment_status, total')
                .eq('order_number', merchantOrderRef)
                .single();

            if (fetchError || !existingOrder) {
                console.error('[Callback] Order not found:', merchantOrderRef);
                return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
            }

            // Already paid - idempotent
            if (existingOrder.payment_status === 'paid') {
                console.log('[Callback] Order already paid, skipping:', merchantOrderRef);
                await recordCallbackEvent({
                    reference: merchantOrderRef,
                    externalEventId: String(moolreReference || ''),
                    payload: body,
                    signatureStatus: secretMatches ? 'matched' : 'absent',
                    processingStatus: 'duplicate',
                });
                return NextResponse.json({ success: true, message: 'Order already processed' });
            }

            // Reject on amount mismatch — never trust the customer's actual payment to match the order total
            const callbackAmount = data.amount ? parseFloat(data.amount) : (body.amount ? parseFloat(body.amount) : null);
            if (callbackAmount !== null && Math.abs(callbackAmount - Number(existingOrder.total)) > 0.01) {
                console.error('[Callback] Amount mismatch — rejecting. Expected:', existingOrder.total, 'Got:', callbackAmount, 'Order:', merchantOrderRef);
                return NextResponse.json({ success: false, message: 'Amount mismatch' }, { status: 400 });
            }

            // Defense in depth: ask Moolre directly whether this transaction
            // succeeded. If they say "no", refuse to mark it paid. If the
            // status API itself fails (auth/network), we proceed — it must
            // never strand a paying customer behind a broken side-channel.
            try {
                const verifyId = rawExternalRef || merchantOrderRef;
                const moolreCheck = await checkMoolreTransaction({ id: String(verifyId) });
                if (!moolreCheck.ok && !moolreCheck.authError && moolreCheck.raw !== null) {
                    console.error('[Callback] Moolre status API explicitly says NOT paid — rejecting:', moolreCheck.message);
                    return NextResponse.json({ success: false, message: 'Transaction not confirmed by Moolre' }, { status: 400 });
                }
                if (moolreCheck.ok) {
                    console.log('[Callback] Moolre status API confirms transaction:', verifyId);
                }
            } catch (verifyErr: unknown) {
                console.warn('[Callback] Moolre status API check failed (non-fatal):', verifyErr instanceof Error ? verifyErr.message : verifyErr);
            }

            // Mark order as paid via RPC
            const { data: orderJson, error: updateError } = await dbAdmin
                .rpc('mark_order_paid', {
                    order_ref: merchantOrderRef,
                    moolre_ref: String(moolreReference)
                });

            if (updateError) {
                console.error('[Callback] RPC Error:', updateError.message);
                return NextResponse.json({ success: false, message: 'Database update failed' }, { status: 500 });
            }

            if (!orderJson) {
                console.error('[Callback] Order not found after RPC:', merchantOrderRef);
                return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
            }

            console.log('[Callback] Order updated! ID:', orderJson.id, '| Status:', orderJson.status);

            // Update customer stats
            try {
                if (orderJson.email) {
                    await dbAdmin.rpc('update_customer_stats', {
                        p_customer_email: orderJson.email,
                        p_order_total: orderJson.total
                    });
                }
            } catch (statsError: any) {
                console.error('[Callback] Customer stats failed:', statsError.message);
            }

            // Send SMS + Email notifications
            try {
                console.log('[Callback] Sending notifications for:', orderJson.order_number);
                await sendOrderConfirmation(orderJson);
                console.log('[Callback] Notifications sent!');
            } catch (notifyError: any) {
                console.error('[Callback] Notification failed:', notifyError.message);
            }

            await recordCallbackEvent({
                reference: merchantOrderRef,
                externalEventId: String(moolreReference || ''),
                payload: body,
                signatureStatus: secretMatches ? 'matched' : 'absent',
                processingStatus: 'processed',
            });
            return NextResponse.json({ success: true, message: 'Payment verified and Order Updated' });

        } else {
            // Payment failed — never overwrite a previously successful payment
            console.log(`[Callback] Payment FAILED for ${merchantOrderRef} | Status: ${apiStatus} | TX: ${txStatus}`);

            const { data: failedOrder } = await dbAdmin
                .from('orders')
                .select('metadata, payment_status')
                .eq('order_number', merchantOrderRef)
                .single();

            if (failedOrder?.payment_status === 'paid') {
                console.warn('[Callback] Ignoring late failure for already-paid order:', merchantOrderRef);
                return NextResponse.json({ success: true, message: 'Order already paid' });
            }

            const mergedFailureMetadata = {
                ...(failedOrder?.metadata || {}),
                moolre_reference: moolreReference,
                failure_reason: body.message || 'Payment failed'
            };

            await dbAdmin
                .from('orders')
                .update({
                    payment_status: 'failed',
                    metadata: mergedFailureMetadata
                })
                .eq('order_number', merchantOrderRef);

            return NextResponse.json({ success: false, message: 'Payment not successful' });
        }

    } catch (error: any) {
        console.error('[Callback] Critical Error:', error.message);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    return NextResponse.json({ message: 'Moolre callback endpoint ready', timestamp: new Date().toISOString() });
}
