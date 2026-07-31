import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { appPublicUrl } from '@/lib/env';

function extractToken(request: NextRequest): string | undefined {
  let token =
    request.cookies.get('app-access-token')?.value ||
    request.cookies.get('sb-access-token')?.value;

  if (!token) {
    const host = (() => {
      try {
        return new URL(appPublicUrl() || request.url).hostname.split('.')[0];
      } catch {
        return '';
      }
    })();
    if (host) {
      token = request.cookies.get(`sb-${host}-auth-token`)?.value;
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
          if (Array.isArray(parsed) && parsed[0]) {
            token = parsed[0];
          } else if (typeof parsed === 'object' && parsed.access_token) {
            token = parsed.access_token;
          } else if (typeof parsed === 'string') {
            token = parsed;
          }
        } catch {
          token = cookie.value;
        }
        if (token) break;
      }
    }
  }

  return token;
}

async function verifyAdmin(
  token: string
): Promise<{ ok: boolean; userId?: string; role?: string }> {
  const secret =
    process.env.AUTH_JWT_SECRET ||
    process.env.JWT_SECRET ||
    process.env.SUPABASE_JWT_SECRET;
  if (!secret) return { ok: false };

  try {
    // Cookie may hold JSON session; extract bare JWT if needed
    let jwt = token;
    try {
      const parsed = JSON.parse(token);
      if (parsed?.access_token) jwt = parsed.access_token;
      else if (Array.isArray(parsed) && parsed[0]) jwt = parsed[0];
    } catch {
      /* bare jwt */
    }

    const { payload } = await jwtVerify(jwt, new TextEncoder().encode(secret));
    if (payload.typ === 'refresh') return { ok: false };
    const userId = typeof payload.sub === 'string' ? payload.sub : undefined;
    if (!userId) return { ok: false };
    const appMeta = (payload.app_metadata || {}) as { role?: string };
    const role = appMeta.role;
    if (role !== 'admin' && role !== 'staff') return { ok: false };
    return { ok: true, userId, role };
  } catch {
    return { ok: false };
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (pathname.startsWith('/admin')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

    if (pathname === '/admin/login') {
      return response;
    }

    const token = extractToken(request);
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const verified = await verifyAdmin(token);
    if (!verified.ok) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('error', 'session_expired');
      return NextResponse.redirect(loginUrl);
    }
    if (verified.userId) response.headers.set('x-user-id', verified.userId);
    if (verified.role) response.headers.set('x-user-role', verified.role);
    return response;
  }

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/rest/') ||
    pathname.startsWith('/auth/v1') ||
    pathname.startsWith('/storage/')
  ) {
    response.headers.set('Cache-Control', 'no-store');
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*',
    '/rest/:path*',
    '/auth/v1/:path*',
    '/storage/:path*',
  ],
};
