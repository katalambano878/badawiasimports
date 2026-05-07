import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Server-side Supabase client bound to the current request/response cookies.
 *
 * Use this in middleware or route handlers (NOT for service-role operations —
 * for those, keep using createClient with SUPABASE_SERVICE_ROLE_KEY directly).
 *
 * The cookie callbacks let supabase-js (a) read the user's session from the
 * incoming request, and (b) write refreshed/cleared session cookies back onto
 * the outgoing response. If you skip the set/remove callbacks, refresh tokens
 * silently fail and users get logged out every ~1h.
 */
export function createSupabaseServerClient(request: NextRequest, response: NextResponse) {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        response.cookies.set({ name, value: '', ...options, maxAge: 0 });
      },
    },
  });
}
