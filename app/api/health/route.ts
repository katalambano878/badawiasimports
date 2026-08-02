import { NextResponse } from 'next/server';
import { isPlainPostgres } from '@/lib/db/mode';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Lightweight health check — no secrets exposed.
 */
export async function GET() {
  const checks: Record<string, string | boolean> = {
    ok: true,
    plainPostgres: isPlainPostgres(),
    appUrlConfigured: !!(
      process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    ),
    anonKeyConfigured: !!(
      process.env.NEXT_PUBLIC_APP_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
    serviceKeyConfigured: !!(
      process.env.APP_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
    moolrePaymentConfigured: !!(
      process.env.MOOLRE_API_USER && process.env.MOOLRE_API_PUBKEY
    ),
    moolreSmsConfigured: !!(
      process.env.MOOLRE_SMS_API_KEY || process.env.MOOLRE_API_KEY
    ),
    paystackConfigured: !!process.env.PAYSTACK_SECRET_KEY,
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
    paypalConfigured: !!(
      process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET
    ),
    emailConfigured: !!process.env.RESEND_API_KEY,
    supabasePackagesRemoved: true,
  };

  if (isPlainPostgres()) {
    try {
      const { query } = await import('@/lib/db/pool');
      await query('SELECT 1 AS ok');
      checks.database = 'up';
      const required = await query<{ missing: string | null }>(
        `SELECT CASE
           WHEN to_regclass('public.orders') IS NULL THEN 'orders'
           WHEN to_regclass('public.products') IS NULL THEN 'products'
           WHEN to_regclass('public.payment_callback_events') IS NULL THEN 'payment_callback_events'
           WHEN to_regclass('public.payment_attempts') IS NULL THEN 'payment_attempts'
           WHEN to_regclass('public.sms_message_events') IS NULL THEN 'sms_message_events'
           WHEN to_regclass('auth.users') IS NULL THEN 'auth.users'
           ELSE NULL
         END AS missing`
      );
      const missing = required.rows[0]?.missing;
      if (missing) {
        checks.ok = false;
        checks.schema = `missing:${missing}`;
      } else {
        checks.schema = 'ok';
      }
    } catch {
      checks.ok = false;
      checks.database = 'down';
    }
  } else {
    checks.database = 'not_plain_pg';
  }

  const status = checks.ok ? 200 : 503;
  return NextResponse.json(checks, { status });
}
