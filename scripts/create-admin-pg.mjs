/**
 * Create/promote an admin user against plain Postgres (auth.users + profiles).
 *
 * Run:
 *   node --env-file=.env.local scripts/create-admin-pg.mjs
 *
 * Requires: DATABASE_URL, CREATE_ADMIN_EMAIL, CREATE_ADMIN_PASSWORD
 */
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const email = (process.env.CREATE_ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.CREATE_ADMIN_PASSWORD || '';

if (!connectionString) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}
if (!email || !password) {
  console.error('Missing CREATE_ADMIN_EMAIL or CREATE_ADMIN_PASSWORD');
  process.exit(1);
}
if (password.length < 8) {
  console.error('CREATE_ADMIN_PASSWORD must be at least 8 characters');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query(
      `SELECT id FROM auth.users WHERE lower(email) = $1 AND deleted_at IS NULL LIMIT 1`,
      [email]
    );

    let userId;
    const hash = await bcrypt.hash(password, 12);

    if (existing.rows[0]) {
      userId = existing.rows[0].id;
      await client.query(
        `UPDATE auth.users
         SET encrypted_password = $2,
             email_confirmed_at = COALESCE(email_confirmed_at, now()),
             updated_at = now()
         WHERE id = $1`,
        [userId, hash]
      );
      console.log('Updated password for existing user:', email);
    } else {
      userId = randomUUID();
      await client.query(
        `INSERT INTO auth.users (
           id, instance_id, aud, role, email, encrypted_password,
           email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
           created_at, updated_at, confirmation_token, recovery_token,
           email_change_token_new, email_change
         ) VALUES (
           $1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
           $2, $3, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
           now(), now(), '', '', '', ''
         )`,
        [userId, email, hash]
      );
      console.log('Created auth user:', email);
    }

    await client.query(
      `INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
       VALUES ($1, $2, $3, 'admin', now(), now())
       ON CONFLICT (id) DO UPDATE
         SET role = 'admin', email = EXCLUDED.email, updated_at = now()`,
      [userId, email, email.split('@')[0]]
    );

    await client.query('COMMIT');
    console.log('Done. Admin ready:', email, '| id:', userId);
    console.log('Sign in at /admin/login');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Failed:', e.message || e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
