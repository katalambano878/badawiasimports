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
    appUrlConfigured: !!process.env.NEXT_PUBLIC_APP_URL,
    supabaseUrlConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
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
  };

  if (isPlainPostgres()) {
    try {
      const { query } = await import('@/lib/db/pool');
      await query('SELECT 1 AS ok');
      checks.database = 'up';
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
