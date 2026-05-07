import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';

/**
 * Server-side order creation.
 *
 * Why this exists:
 *   Inserting orders from the browser using the anon key forces us to maintain
 *   a permissive RLS INSERT policy on `public.orders`, which is fragile (stale
 *   sessions, cookie quirks, etc. trip RLS even for legitimate guests). Doing
 *   the insert here with the service-role key removes that whole class of
 *   "Failed to place order" errors.
 *
 * Security wins on top of fixing checkout:
 *   - Re-fetches each product's price from the database, so a tampered cart
 *     can't be used to pay 1 GH₵ for a 10 000 GH₵ item.
 *   - Generates the order number, lookup token, and primary key on the server.
 *   - Origin + rate-limit gating to discourage abuse.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
  console.error('[orders/create] SUPABASE_SERVICE_ROLE_KEY missing');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const allowedOriginPattern = /^https?:\/\/(?:www\.)?(badawiasimports\.com|localhost(?::\d+)?|127\.0\.0\.1(?::\d+)?|.*\.vercel\.app)/i;

const isValidUUID = (str: string) =>
  typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

interface CartItemInput {
  id: string;
  name?: string;
  variant?: string | null;
  quantity: number;
  price?: number;
  image?: string | null;
  slug?: string | null;
}

interface ShippingInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  region?: string;
  [k: string]: unknown;
}

interface CreateOrderBody {
  cart?: CartItemInput[];
  shipping?: ShippingInput;
  delivery_method?: string;
  payment_method?: string;
  user_id?: string | null;
}

export async function POST(request: Request) {
  try {
    const clientId = getClientIdentifier(request);
    const rl = checkRateLimit(`orders-create:${clientId}`, RATE_LIMITS.payment);
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
    }

    const origin = request.headers.get('origin') || '';
    const referer = request.headers.get('referer') || '';
    const originOk = !origin || allowedOriginPattern.test(origin);
    const refererOk = !referer || allowedOriginPattern.test(referer);
    if (!originOk || !refererOk) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: CreateOrderBody = await request.json().catch(() => ({} as CreateOrderBody));
    const { cart, shipping, delivery_method, payment_method, user_id } = body;

    if (!Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }
    if (!shipping || typeof shipping !== 'object') {
      return NextResponse.json({ error: 'Shipping details are required' }, { status: 400 });
    }
    const required: (keyof ShippingInput)[] = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'region'];
    for (const k of required) {
      if (!shipping[k] || typeof shipping[k] !== 'string') {
        return NextResponse.json({ error: `Missing shipping field: ${k}` }, { status: 400 });
      }
    }

    // Resolve every cart item server-side. Slugs become UUIDs, prices come from
    // the database, not from the client.
    const slugs: string[] = [];
    const ids: string[] = [];
    for (const item of cart) {
      if (!item || typeof item.id !== 'string') {
        return NextResponse.json({ error: 'Invalid cart item' }, { status: 400 });
      }
      if (isValidUUID(item.id)) ids.push(item.id);
      else slugs.push(item.id);
    }

    const productMap = new Map<string, { id: string; name: string; price: number; sale_price: number | null; metadata: Record<string, unknown> | null; slug: string | null }>();

    if (ids.length > 0) {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, sale_price, metadata, slug')
        .in('id', ids);
      if (error) {
        console.error('[orders/create] product lookup by id failed:', error.message);
        return NextResponse.json({ error: 'Could not validate cart' }, { status: 500 });
      }
      for (const p of data || []) productMap.set(p.id, p);
    }
    if (slugs.length > 0) {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, sale_price, metadata, slug')
        .in('slug', slugs);
      if (error) {
        console.error('[orders/create] product lookup by slug failed:', error.message);
        return NextResponse.json({ error: 'Could not validate cart' }, { status: 500 });
      }
      for (const p of data || []) {
        productMap.set(p.id, p);
        if (p.slug) productMap.set(p.slug, p);
      }
    }

    let subtotal = 0;
    const orderItems: Array<{
      product_id: string;
      product_name: string;
      variant_name: string | null;
      quantity: number;
      unit_price: number;
      total_price: number;
      metadata: Record<string, unknown>;
    }> = [];

    for (const item of cart) {
      const product = productMap.get(item.id);
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.name || item.id}` }, { status: 400 });
      }
      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const unit = Number(product.sale_price ?? product.price);
      if (!Number.isFinite(unit) || unit < 0) {
        return NextResponse.json({ error: `Invalid price for product: ${product.name}` }, { status: 400 });
      }
      const line = unit * qty;
      subtotal += line;
      orderItems.push({
        product_id: product.id,
        product_name: product.name || item.name || 'Product',
        variant_name: (item.variant ?? null) as string | null,
        quantity: qty,
        unit_price: unit,
        total_price: line,
        metadata: {
          image: item.image ?? null,
          slug: product.slug ?? item.slug ?? null,
          preorder_shipping: (product.metadata as { preorder_shipping?: unknown } | null)?.preorder_shipping ?? null,
        },
      });
    }

    const shippingTotal = 0;
    const taxTotal = 0;
    const discountTotal = 0;
    const total = subtotal + shippingTotal + taxTotal - discountTotal;

    const orderId = crypto.randomUUID();
    const lookupToken = crypto.randomUUID();
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const trackingId = Array.from(
      { length: 6 },
      () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]
    ).join('');
    const trackingNumber = `SLI-${trackingId}`;

    const orderRow = {
      id: orderId,
      order_number: orderNumber,
      user_id: user_id && typeof user_id === 'string' ? user_id : null,
      email: shipping.email,
      phone: shipping.phone,
      status: 'pending',
      payment_status: 'pending',
      currency: 'GHS',
      subtotal,
      tax_total: taxTotal,
      shipping_total: shippingTotal,
      discount_total: discountTotal,
      total,
      shipping_method: delivery_method || 'pickup',
      payment_method: payment_method || 'moolre',
      shipping_address: shipping,
      billing_address: shipping,
      metadata: {
        guest_checkout: !user_id,
        first_name: shipping.firstName,
        last_name: shipping.lastName,
        tracking_number: trackingNumber,
        payment_method: payment_method || 'moolre',
        lookup_token: lookupToken,
      },
    };

    const { error: orderError } = await supabase.from('orders').insert([orderRow]);
    if (orderError) {
      console.error('[orders/create] insert order failed:', orderError.message);
      return NextResponse.json({ error: 'Could not create order' }, { status: 500 });
    }

    const itemsRows = orderItems.map((it) => ({ ...it, order_id: orderId }));
    const { error: itemsError } = await supabase.from('order_items').insert(itemsRows);
    if (itemsError) {
      console.error('[orders/create] insert order_items failed:', itemsError.message);
      // Roll back the parent order so we don't leave orphans.
      await supabase.from('orders').delete().eq('id', orderId);
      return NextResponse.json({ error: 'Could not save order items' }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        order: {
          id: orderId,
          order_number: orderNumber,
          tracking_number: trackingNumber,
          lookup_token: lookupToken,
          subtotal,
          tax_total: taxTotal,
          shipping_total: shippingTotal,
          discount_total: discountTotal,
          total,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e) {
    console.error('[orders/create] Unexpected error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
