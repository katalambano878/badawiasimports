import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';

/**
 * Server-side guest order lookup.
 *
 * Why this exists:
 *   The orders table no longer allows the anon key to read guest orders directly
 *   (that policy leaked every guest's PII). Instead, /order-success and /pay/[orderId]
 *   call this endpoint with the order_number plus a per-order lookup_token that was
 *   generated at checkout and stored in orders.metadata.lookup_token.
 *
 * Auth model:
 *   - Logged-in users hitting their own orders use their session against RLS instead;
 *     they do not need to call this endpoint.
 *   - Guests pass { order_number, token }. Token is a UUID, ~122 bits of entropy,
 *     not enumerable.
 */



export async function POST(request: Request) {
  try {
    const clientId = getClientIdentifier(request);
    const rl = checkRateLimit(`orders-lookup:${clientId}`, RATE_LIMITS.default);
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const orderNumber: string | undefined = body.order_number || body.orderNumber;
    const token: string | undefined = body.token;

    if (!orderNumber || !token) {
      return NextResponse.json({ error: 'order_number and token are required' }, { status: 400 });
    }

    // The /pay page accepts either an order_number (e.g. ORD-...) or a UUID id.
    // We deliberately split this into two queries instead of `.or(order_number.eq,id.eq)`
    // because PostgREST evaluates BOTH sides and the `id.eq.<non-uuid>` half makes
    // PostgreSQL throw `invalid input syntax for type uuid`, which surfaces as a 500
    // and breaks every order-success page for guest customers.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderNumber);
    const selectCols = `
        id,
        order_number,
        email,
        phone,
        status,
        payment_status,
        currency,
        subtotal,
        tax_total,
        shipping_total,
        discount_total,
        total,
        shipping_method,
        payment_method,
        shipping_address,
        billing_address,
        metadata,
        created_at,
        order_items (
          id,
          product_id,
          product_name,
          variant_name,
          quantity,
          unit_price,
          total_price,
          metadata
        )
      `;

    let { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(selectCols)
      .eq('order_number', orderNumber)
      .maybeSingle();

    if (!order && !error && isUuid) {
      const fallback = await supabaseAdmin
        .from('orders')
        .select(selectCols)
        .eq('id', orderNumber)
        .maybeSingle();
      order = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error('[orders/lookup] DB error:', error.message);
      return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
    }
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Constant-time-ish token comparison (length-aware) to defeat trivial timing leaks.
    const stored = (order.metadata as { lookup_token?: string } | null)?.lookup_token;
    if (!stored || stored.length !== token.length || !safeEqual(stored, token)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
    }

    return NextResponse.json({ order }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    console.error('[orders/lookup] Unexpected error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

function safeEqual(a: string, b: string): boolean {
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
