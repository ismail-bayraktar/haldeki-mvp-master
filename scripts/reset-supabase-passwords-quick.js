/**
 * Quick Password Reset Script
 *
 * Resets passwords for test accounts using Supabase Management API
 *
 * Usage: node scripts/reset-supabase-passwords-quick.js [password]
 * Example: node scripts/reset-supabase-passwords-quick.js Test1234!
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const DEFAULT_PASSWORD = 'Test1234!';
const newPassword = process.argv[2] || DEFAULT_PASSWORD;

const USERS_TO_RESET = [
  'admin@haldeki.com',
  'superadmin@test.haldeki.com',
  'supplier-approved@test.haldeki.com'
];

async function getUserByEmail(email) {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }

  return users.find(user => user.email === email);
}

async function resetUserPassword(email, password) {
  try {
    const user = await getUserByEmail(email);

    if (!user) {
      console.log(`NOT FOUND: ${email}`);
      return false;
    }

    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true
    });

    if (error) {
      console.log(`FAILED: ${email} - ${error.message}`);
      return false;
    }

    console.log(`SUCCESS: ${email}`);
    return true;
  } catch (error) {
    console.log(`ERROR: ${email} - ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('============================================================================');
  console.log('QUICK PASSWORD RESET');
  console.log('============================================================================');
  console.log(`New Password: ${newPassword}`);
  console.log('');

  let successCount = 0;
  let failCount = 0;

  for (const email of USERS_TO_RESET) {
    const success = await resetUserPassword(email, newPassword);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('');
  console.log('============================================================================');
  console.log('SUMMARY');
  console.log('============================================================================');
  console.log(`Total: ${USERS_TO_RESET.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log('============================================================================');
}

main().catch(console.error);
