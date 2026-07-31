import { NextResponse, NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { dbAdmin } from '@/lib/db/admin';
import { appPublicUrl } from '@/lib/env';

/**
 * Admin-only proxy for the mark_order_paid RPC.
 * Auth: JWT from cookies (same secrets as middleware /auth/v1).
 */

function extractToken(request: NextRequest): string | undefined {
  let token =
    request.cookies.get('app-access-token')?.value ||
    request.cookies.get('sb-access-token')?.value;

  if (!token) {
    try {
      const host = new URL(appPublicUrl() || request.url).hostname.split('.')[0];
      if (host) token = request.cookies.get(`sb-${host}-auth-token`)?.value;
    } catch {
      /* ignore */
    }
  }

  if (!token) {
    for (const [name, cookie] of request.cookies) {
      if (
        (name.startsWith('sb-') || name.startsWith('app-')) &&
        (name.endsWith('-auth-token') || name.includes('auth'))
      ) {
        try {
          const parsed = JSON.parse(cookie.value);
          if (Array.isArray(parsed) && parsed[0]) token = parsed[0];
          else if (typeof parsed === 'object' && parsed.access_token) {
            token = parsed.access_token;
          } else if (typeof parsed === 'string') token = parsed;
        } catch {
          token = cookie.value;
        }
        if (token) break;
      }
    }
  }

  const auth = request.headers.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!token && m) token = m[1];
  return token;
}

async function resolveAdminUser(
  request: NextRequest
): Promise<{ id: string; role: string } | null> {
  const token = extractToken(request);
  if (!token) return null;
  const secret =
    process.env.AUTH_JWT_SECRET ||
    process.env.JWT_SECRET ||
    process.env.SUPABASE_JWT_SECRET;
  if (!secret) return null;

  try {
    let jwt = token;
    try {
      const parsed = JSON.parse(token);
      if (parsed?.access_token) jwt = parsed.access_token;
      else if (Array.isArray(parsed) && parsed[0]) jwt = parsed[0];
    } catch {
      /* bare */
    }

    const { payload } = await jwtVerify(jwt, new TextEncoder().encode(secret));
    if (payload.typ === 'refresh') return null;
    const userId = typeof payload.sub === 'string' ? payload.sub : null;
    if (!userId) return null;
    const appMeta = (payload.app_metadata || {}) as { role?: string };
    let role = appMeta.role;
    if (role !== 'admin' && role !== 'staff') {
      const { data: profile } = await dbAdmin
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      role = profile?.role;
    }
    if (role !== 'admin' && role !== 'staff') return null;
    return { id: userId, role };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await resolveAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { order_ref, moolre_ref } = body;

    if (!order_ref || typeof order_ref !== 'string') {
      return NextResponse.json({ error: 'order_ref is required' }, { status: 400 });
    }

    const { data, error } = await dbAdmin.rpc('mark_order_paid', {
      order_ref,
      moolre_ref: moolre_ref || `ADMIN-${admin.id.slice(0, 8)}-${Date.now()}`,
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
