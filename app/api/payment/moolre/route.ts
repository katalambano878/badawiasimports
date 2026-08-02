import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';
import { dbAdmin } from '@/lib/db/admin';
import { recordPaymentAttempt } from '@/lib/db/payments-ledger';

export async function POST(req: Request) {
    try {
        // Rate limiting
        const clientId = getClientIdentifier(req);
        const rateLimitResult = checkRateLimit(`payment:${clientId}`, RATE_LIMITS.payment);
        
        if (!rateLimitResult.success) {
            return NextResponse.json(
                { success: false, message: 'Too many requests. Please try again later.' },
                { 
                    status: 429,
                    headers: {
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': rateLimitResult.resetIn.toString()
                    }
                }
            );
        }

        const body = await req.json();
        const { orderId, customerEmail } = body;

        if (!orderId) {
            return NextResponse.json({ success: false, message: 'Missing orderId' }, { status: 400 });
        }

        if (!process.env.MOOLRE_API_USER || !process.env.MOOLRE_API_PUBKEY || !process.env.MOOLRE_ACCOUNT_NUMBER) {
            console.error('Missing Moolre credentials');
            return NextResponse.json({ success: false, message: 'Mobile Money is not configured. Please add MOOLRE_API_USER, MOOLRE_API_PUBKEY and MOOLRE_ACCOUNT_NUMBER in your environment or contact the store.' }, { status: 500 });
        }

        const requestUrl = new URL(req.url);
        const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin).replace(/\/+$/, '');

        const uniqueRef = `${orderId}-R${Date.now()}`;

        // Always source the amount from the database — never trust client-supplied amount.
        // Also pull the lookup_token so we can append it to the redirect URL (the storefront
        // pages need it to read the order back without an open RLS policy).
        const { data: existingOrder, error: orderFetchError } = await dbAdmin
            .from('orders')
            .select('id, order_number, payment_status, metadata, total, user_id, currency')
            .eq('order_number', orderId)
            .single();

        if (orderFetchError || !existingOrder) {
            return NextResponse.json({ success: false, message: 'Order not found for payment initialization' }, { status: 404 });
        }

        if (existingOrder.payment_status === 'paid') {
            return NextResponse.json({ success: false, message: 'This order is already paid.' }, { status: 400 });
        }

        const amount = Number(existingOrder.total);
        if (!Number.isFinite(amount) || amount <= 0) {
            return NextResponse.json({ success: false, message: 'Invalid order total' }, { status: 400 });
        }

        const mergedMetadata = {
            ...(existingOrder.metadata || {}),
            payment_method: 'moolre',
            moolre_externalref: uniqueRef,
            payment_attempted_at: new Date().toISOString()
        };

        const { error: orderUpdateError } = await dbAdmin
            .from('orders')
            .update({
                payment_status: 'pending',
                metadata: mergedMetadata
            })
            .eq('order_number', orderId);

        if (orderUpdateError) {
            return NextResponse.json({ success: false, message: `Failed to prepare payment: ${orderUpdateError.message}` }, { status: 500 });
        }

        await recordPaymentAttempt({
            orderId: existingOrder.id,
            orderNumber: orderId,
            userId: existingOrder.user_id,
            gateway: 'moolre',
            internalReference: uniqueRef,
            expectedAmount: amount,
            currency: existingOrder.currency || 'GHS',
            status: 'initiated',
            idempotencyKey: `moolre:${uniqueRef}`,
            metadata: { customer_email: customerEmail || null },
        });

        const lookupToken = (existingOrder.metadata as { lookup_token?: string } | null)?.lookup_token || '';
        const tokenSuffix = lookupToken ? `&token=${encodeURIComponent(lookupToken)}` : '';

        const payload = {
            type: 1,
            amount: amount.toString(),
            email: process.env.MOOLRE_MERCHANT_EMAIL || 'admin@example.com',
            externalref: uniqueRef,
            callback: `${baseUrl}/api/payment/moolre/callback`,
            redirect: `${baseUrl}/order-success?order=${orderId}&payment_success=true${tokenSuffix}`,
            reusable: "0",
            currency: "GHS",
            accountnumber: process.env.MOOLRE_ACCOUNT_NUMBER,
            metadata: {
                customer_email: customerEmail,
                original_order_number: orderId
            }
        };

        console.log('[Payment] Initiating for order:', orderId, '| Amount:', amount, '| Callback:', payload.callback);

        const response = await fetch('https://api.moolre.com/embed/link', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-USER': process.env.MOOLRE_API_USER,
                'X-API-PUBKEY': process.env.MOOLRE_API_PUBKEY
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log('[Payment] Response status:', result.status, '| Has URL:', !!result.data?.authorization_url);

        if (result.status === 1 && result.data?.authorization_url) {
            return NextResponse.json({ success: true, url: result.data.authorization_url, reference: result.data.reference });
        } else {
            return NextResponse.json({ success: false, message: result.message || 'Failed to generate payment link' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Payment API Error:', error);
        return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
