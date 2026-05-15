import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

/**
 * One-shot migration: find every row in `users` whose `password_hash` is
 * stored as plaintext (i.e. does NOT start with $2a$/$2b$/$2y$), bcrypt it
 * in place, and update the row.
 *
 * Why this exists: the login handler in server/routes.ts currently has a
 * fallback that, when password_hash isn't bcrypt, compares plaintext with
 * `===` and lazily bcrypts on success. That auto-upgrade only fires for
 * users who log in, and leaves dormant accounts as plaintext in the DB.
 * Once this script has run for everyone, the plaintext fallback can be
 * removed from the login handler.
 *
 * Usage:
 *   # Dry run (default) — only reports who would be migrated, no writes:
 *   npx tsx scripts/migrate-plaintext-passwords.ts
 *
 *   # Actually rewrite the rows:
 *   npx tsx scripts/migrate-plaintext-passwords.ts --apply
 *
 * Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.
 */

const apply = process.argv.includes('--apply');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const isBcrypt = (s: string | null | undefined) =>
  !!s && (s.startsWith('$2a$') || s.startsWith('$2b$') || s.startsWith('$2y$'));

async function main() {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, username, password_hash, is_active');

  if (error) {
    console.error('Failed to fetch users:', error.message);
    process.exit(1);
  }
  if (!users) {
    console.log('No users returned.');
    return;
  }

  const targets = users.filter(u => u.password_hash && !isBcrypt(u.password_hash));
  console.log(`Scanned ${users.length} users — ${targets.length} have plaintext password_hash:`);
  for (const u of targets) {
    console.log(`  - ${u.username} (id ${u.id}${u.is_active ? '' : ', inactive'})`);
  }

  if (targets.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  if (!apply) {
    console.log('\nDry run only. Re-run with --apply to rewrite these rows.');
    return;
  }

  console.log('\nApplying bcrypt hashes…');
  let ok = 0;
  let fail = 0;
  for (const u of targets) {
    try {
      const hashed = await bcrypt.hash(u.password_hash as string, 10);
      const { error: upErr } = await supabase
        .from('users')
        .update({ password_hash: hashed })
        .eq('id', u.id);
      if (upErr) throw upErr;
      console.log(`  ✓ ${u.username}`);
      ok++;
    } catch (e: any) {
      console.error(`  ✗ ${u.username}: ${e.message ?? e}`);
      fail++;
    }
  }
  console.log(`\nDone. updated=${ok} failed=${fail}`);
  if (fail > 0) process.exit(1);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
