import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * Admin-only proxy for the mark_order_paid RPC.
 *
 * The RPC was revoked from anon/authenticated in the security audit (anyone could
 * mark any order as paid → trigger stock reduction → cause fraud). The admin POS
 * still legitimately needs to call it for cash/card sales rung up at the counter.
 *
 * Auth model:
 *   - Caller must have a valid Supabase session cookie (set by /admin/login).
 *   - Their profile.role must be 'admin' or 'staff'.
 *   - We verify both via @supabase/ssr, then call the RPC with the service_role
 *     key (since authenticated role no longer has EXECUTE).
 */


export async function POST(request: NextRequest) {
  const response = NextResponse.next();

  try {
    const sessionClient = createSupabaseServerClient(request, response);
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { order_ref, moolre_ref } = body;

    if (!order_ref || typeof order_ref !== 'string') {
      return NextResponse.json({ error: 'order_ref is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.rpc('mark_order_paid', {
      order_ref,
      moolre_ref: moolre_ref || `ADMIN-${user.id.slice(0, 8)}-${Date.now()}`,
    });

    if (error) {
      console.error('[admin/mark-paid] RPC error:', error.message);
      return NextResponse.json({ error: 'Failed to mark order paid' }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: data });
  } catch (e) {
    console.error('[admin/mark-paid] Unexpected error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
