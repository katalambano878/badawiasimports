import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
}

/**
 * Browser-side Supabase client.
 *
 * Storage backend: cookies (NOT localStorage). This is the critical change for the
 * admin server-side gate (middleware.ts) — middleware can read cookies but cannot
 * read localStorage. Sessions are synced to two cookies (sb-<project>-auth-token.0
 * and .1, set HttpOnly=false because the browser client also needs them).
 *
 * Existing app code can keep importing `supabase` from this file unchanged. The
 * createBrowserClient API surface is the same as createClient for the calls we use.
 */
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseKey);
