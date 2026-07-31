import { NextResponse, NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { dbAdmin } from '@/lib/db/admin';
import { appPublicUrl } from '@/lib/env';

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

async function requireStaff(request: NextRequest): Promise<{ id: string } | null> {
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
    return { id: userId };
  } catch {
    return null;
  }
}

async function deleteOneProduct(productId: string): Promise<{ ok: true } | { ok: false; message: string }> {
  // Preserve order history: detach line items, then remove owned catalog rows.
  const { error: detachErr } = await dbAdmin
    .from('order_items')
    .update({ product_id: null, variant_id: null })
    .eq('product_id', productId);
  if (detachErr) {
    return { ok: false, message: detachErr.message || 'Could not detach order items' };
  }

  // Best-effort cleanup of owned rows (CASCADE FKs also cover these after migration).
  await dbAdmin.from('product_images').delete().eq('product_id', productId);
  await dbAdmin.from('product_variants').delete().eq('product_id', productId);
  await dbAdmin.from('cart_items').delete().eq('product_id', productId);
  await dbAdmin.from('wishlist_items').delete().eq('product_id', productId);
  await dbAdmin.from('reviews').delete().eq('product_id', productId);

  const { error } = await dbAdmin.from('products').delete().eq('id', productId);
  if (error) {
    return { ok: false, message: error.message || 'Failed to delete product' };
  }
  return { ok: true };
}

export async function POST(request: NextRequest) {
  try {
    const staff = await requireStaff(request);
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids)
      ? body.ids.filter((id: unknown) => typeof id === 'string' && id.length > 0)
      : typeof body?.id === 'string'
        ? [body.id]
        : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: 'Product id(s) required' }, { status: 400 });
    }

    const failed: { id: string; message: string }[] = [];
    const deleted: string[] = [];

    for (const id of ids) {
      const result = await deleteOneProduct(id);
      if (result.ok) deleted.push(id);
      else failed.push({ id, message: result.message });
    }

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: failed[0]?.message || 'Delete failed', failed },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted,
      failed: failed.length ? failed : undefined,
    });
  } catch (e) {
    console.error('[admin/products/delete]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
