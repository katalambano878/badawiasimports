import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';

/**
 * Server-side proxy for the upsert_customer_from_order RPC.
 *
 * Why this exists:
 *   The RPC is SECURITY DEFINER and write-capable (creates/updates customer rows).
 *   In the security audit we revoked EXECUTE for anon/authenticated to stop
 *   internet-wide abuse. The storefront checkout and admin POS still need to call
 *   it after creating an order, so they call this endpoint instead, which uses
 *   the service_role key behind a basic origin + rate-limit check.
 */



const allowedOriginPattern = /^https?:\/\/(?:www\.)?(badawiasimports\.com|localhost(?::\d+)?|127\.0\.0\.1(?::\d+)?|.*\.vercel\.app)/i;

export async function POST(request: Request) {
  try {
    const clientId = getClientIdentifier(request);
    const rl = checkRateLimit(`customer-upsert:${clientId}`, RATE_LIMITS.default);
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Reject cross-site spam — only our own pages should be hitting this.
    const origin = request.headers.get('origin') || '';
    const referer = request.headers.get('referer') || '';
    const originOk = !origin || allowedOriginPattern.test(origin);
    const refererOk = !referer || allowedOriginPattern.test(referer);
    if (!originOk || !refererOk) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      email,
      phone,
      full_name,
      first_name,
      last_name,
      user_id,
      address,
      order_number, // optional — used to verify a real order exists for this email
    } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    // Light anti-abuse: require an existing order with this email before letting
    // an arbitrary client upsert a customer record. Cuts off blind spam.
    if (order_number) {
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('order_number', order_number)
        .eq('email', email)
        .maybeSingle();
      if (!order) {
        return NextResponse.json({ error: 'Order/email mismatch' }, { status: 403 });
      }
    }

    const { error } = await supabaseAdmin.rpc('upsert_customer_from_order', {
      p_email: email,
      p_phone: phone || null,
      p_full_name: full_name || null,
      p_first_name: first_name || null,
      p_last_name: last_name || null,
      p_user_id: user_id || null,
      p_address: address || null,
    });

    if (error) {
      console.error('[customers/upsert-from-order] RPC error:', error.message);
      return NextResponse.json({ error: 'Failed to upsert customer' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[customers/upsert-from-order] Unexpected error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
