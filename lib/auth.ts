import { verifyAccessToken } from '@/lib/db/auth';
import { query } from '@/lib/db/pool';

export interface AuthResult {
  authenticated: boolean;
  user?: { id: string; email: string; role?: string };
  role?: string;
  error?: string;
}

function readToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim() || null;
  }
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/(?:^|;\s*)sb-access-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function verifyAuth(
  request: Request,
  options: { requireAdmin?: boolean } = {}
): Promise<AuthResult> {
  const token = readToken(request);
  if (!token) {
    return { authenticated: false, error: 'Missing authorization token' };
  }

  try {
    const verified = await verifyAccessToken(token);
    if (!verified) {
      return { authenticated: false, error: 'Invalid or expired token' };
    }

    const email =
      typeof verified.payload.email === 'string' ? verified.payload.email : '';
    const user = { id: verified.userId, email };

    if (options.requireAdmin) {
      const { rows } = await query<{ role: string; email: string | null }>(
        `SELECT role, email FROM profiles WHERE id = $1 LIMIT 1`,
        [verified.userId]
      );
      const profile = rows[0];
      if (!profile) {
        return { authenticated: false, error: 'Could not verify user role' };
      }
      if (profile.role !== 'admin' && profile.role !== 'staff') {
        return { authenticated: false, error: 'Admin access required' };
      }
      return {
        authenticated: true,
        user: { id: verified.userId, email: profile.email || email, role: profile.role },
        role: profile.role,
      };
    }

    return { authenticated: true, user };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Auth verification failed';
    return { authenticated: false, error: message };
  }
}

export async function verifyAdminToken(token: string): Promise<AuthResult> {
  return verifyAuth(new Request('http://local', { headers: { authorization: `Bearer ${token}` } }), {
    requireAdmin: true,
  });
}
