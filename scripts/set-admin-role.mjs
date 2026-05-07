/**
 * Set an existing user's profile role to admin (for accounts that already exist and can log in).
 * Run: node --env-file=.env.local scripts/set-admin-role.mjs your@email.com
 * Or set SET_ADMIN_EMAIL in .env.local and run: node --env-file=.env.local scripts/set-admin-role.mjs
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (Supabase Dashboard → Settings → API → service_role secret)
 *   SET_ADMIN_EMAIL (optional if you pass email as first argument)
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2] || process.env.SET_ADMIN_EMAIL;

if (!url || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error('Get the service role key: Supabase Dashboard → Settings → API → service_role (secret)');
  process.exit(1);
}
if (!email) {
  console.error('Usage: node --env-file=.env.local scripts/set-admin-role.mjs your@email.com');
  console.error('Or set SET_ADMIN_EMAIL in .env.local');
  process.exit(1);
}

const restUrl = `${url}/rest/v1`;
const headers = {
  'Content-Type': 'application/json',
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  Prefer: 'return=representation',
};

async function main() {
  console.log('Setting admin role for:', email);

  const updateRes = await fetch(`${restUrl}/profiles?email=eq.${encodeURIComponent(email)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ role: 'admin' }),
  });

  if (updateRes.ok) {
    const data = await updateRes.json().catch(() => []);
    if (Array.isArray(data) && data.length > 0) {
      console.log('Done. Role set to admin for', email);
      console.log('Sign in at /admin/login');
      return;
    }
  }

  console.log('No profile row found for that email. Trying to create from auth.users...');

  const authUsersUrl = `${url}/auth/v1/admin/users`;
  const listRes = await fetch(authUsersUrl, {
    method: 'GET',
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
  });
  if (!listRes.ok) {
    console.error('Could not list users. Run this in Supabase SQL Editor instead:');
    console.error("  UPDATE profiles SET role = 'admin' WHERE email = '" + email + "';");
    console.error("  Or if no profile row: INSERT INTO profiles (id, email, role) SELECT id, email, 'admin' FROM auth.users WHERE email = '" + email + "' ON CONFLICT (id) DO UPDATE SET role = 'admin';");
    process.exit(1);
  }
  const users = await listRes.json();
  const user = users.users?.find((u) => u.email === email) || users.find((u) => u.email === email);
  if (!user) {
    console.error('No user with email', email, 'in Supabase Auth.');
    console.error('Create the user first (sign up at /auth/signup) or use the correct email.');
    process.exit(1);
  }

  const insertRes = await fetch(`${restUrl}/profiles`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({ id: user.id, email: user.email, role: 'admin' }),
  });

  if (insertRes.ok) {
    console.log('Profile created and role set to admin for', email);
    console.log('Sign in at /admin/login');
    return;
  }

  const insertErr = await insertRes.text();
  if (insertRes.status === 409 || insertErr.includes('duplicate') || insertErr.includes('unique')) {
    const retryRes = await fetch(`${restUrl}/profiles?id=eq.${user.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ role: 'admin' }),
    });
    if (retryRes.ok) {
      console.log('Done. Role set to admin for', email);
      console.log('Sign in at /admin/login');
      return;
    }
  }

  console.error('Update failed:', insertErr || insertRes.statusText);
  console.error('Run this in Supabase SQL Editor instead:');
  console.error("  UPDATE profiles SET role = 'admin' WHERE email = '" + email + "';");
  process.exit(1);
}

main();
