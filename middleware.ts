import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * Admin gate (P1-1).
 *
 * Before this middleware existed in this form, /admin/* HTML and JS bundles were
 * served to anyone who asked, and the "are you an admin?" check ran in the
 * browser inside app/admin/layout.tsx. That meant unauthenticated visitors could
 * still download the admin shell, see internal API endpoints in the JS bundle,
 * and probe around. (Data was safe because Supabase RLS still blocked them, but
 * the surface area was unnecessarily exposed.)
 *
 * Now: every request to /admin/* (except /admin/login) is intercepted here. We
 * read the session cookie, look up the user's role in `profiles`, and redirect
 * to /admin/login unless role is 'admin' or 'staff'. The admin pages never even
 * reach the visitor's browser unless they pass.
 *
 * RLS remains the data-layer guard — this middleware is defense in depth at the
 * surface layer.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  if (!pathname.startsWith('/admin')) {
    return response;
  }

  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  // The login page itself must always be reachable.
  if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
    return response;
  }

  const supabase = createSupabaseServerClient(request, response);

  // getUser() validates the JWT against Supabase Auth (vs. getSession() which
  // only decodes whatever's in the cookie). Use getUser for security gates.
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return redirectToLogin(request, response);
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return redirectToLogin(request, response, 'no_profile');
  }

  if (profile.role !== 'admin' && profile.role !== 'staff') {
    return redirectToLogin(request, response, 'unauthorized');
  }

  return response;
}

function redirectToLogin(request: NextRequest, response: NextResponse, errorCode?: string) {
  const url = request.nextUrl.clone();
  url.pathname = '/admin/login';
  url.search = errorCode ? `?error=${encodeURIComponent(errorCode)}` : '';
  const redirect = NextResponse.redirect(url);

  // Preserve any session cookies that supabase-ssr just rotated onto `response`
  // so refreshed tokens aren't dropped by the redirect.
  response.cookies.getAll().forEach(c => redirect.cookies.set(c));
  return redirect;
}

export const config = {
  matcher: ['/admin/:path*'],
};
