import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/db/admin';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';
import { recordPaymentAttempt } from '@/lib/db/payments-ledger';


/**
 * Initialize a Paystack transaction.
 * Amount in GHS is sent in pesewas (multiply by 100).
 */
export async function POST(req: Request) {
  try {
    const clientId = getClientIdentifier(req);
    const rateLimitResult = checkRateLimit(`payment:${clientId}`, RATE_LIMITS.payment);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetIn.toString(),
          },
        }
      );
    }

    const body = await req.json();
    const { orderId, customerEmail } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'Missing orderId' }, { status: 400 });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      console.error('Missing PAYSTACK_SECRET_KEY');
      return NextResponse.json({ success: false, message: 'Paystack is not configured. Please add PAYSTACK_SECRET_KEY in your environment or contact the store.' }, { status: 500 });
    }

    const { data: existingOrder, error: orderFetchError } = await dbAdmin
      .from('orders')
      .select('id, order_number, payment_status, total, metadata, user_id, currency')
      .eq('order_number', orderId)
      .single();
    if (orderFetchError || !existingOrder) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }
    if (existingOrder.payment_status === 'paid') {
      return NextResponse.json({ success: false, message: 'This order is already paid.' }, { status: 400 });
    }
    const amount = Number(existingOrder.total);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid order total' }, { status: 400 });
    }
    const lookupToken = (existingOrder.metadata as { lookup_token?: string } | null)?.lookup_token || '';

    const requestUrl = new URL(req.url);
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin).replace(/\/+$/, '');

    const amountInPesewas = Math.round(amount * 100);
    if (amountInPesewas < 10) {
      return NextResponse.json({ success: false, message: 'Amount too small (min GH₵0.10)' }, { status: 400 });
    }

    // Unique reference for this payment attempt (allow retries)
    const reference = `${orderId}-R${Date.now()}`;

    await recordPaymentAttempt({
      orderId: existingOrder.id,
      orderNumber: orderId,
      userId: existingOrder.user_id,
      gateway: 'paystack',
      internalReference: reference,
      expectedAmount: amount,
      currency: existingOrder.currency || 'GHS',
      status: 'initiated',
      idempotencyKey: `paystack:${reference}`,
    });

    const payload = {
      email: customerEmail || 'customer@example.com',
      amount: amountInPesewas,
      currency: 'GHS',
      reference,
      callback_url: `${baseUrl}/order-success?order=${encodeURIComponent(orderId)}&payment_success=true${lookupToken ? `&token=${encodeURIComponent(lookupToken)}` : ''}`,
      metadata: {
        order_number: orderId,
        custom_fields: [
          { display_name: 'Order', variable_name: 'order_number', value: orderId },
        ],
      },
    };

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.status && result.data?.authorization_url) {
      return NextResponse.json({
        success: true,
        url: result.data.authorization_url,
        reference: result.data.reference,
        access_code: result.data.access_code,
      });
    }

    return NextResponse.json(
      { success: false, message: result.message || 'Failed to initialize Paystack payment' },
      { status: 400 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Paystack API Error:', error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
