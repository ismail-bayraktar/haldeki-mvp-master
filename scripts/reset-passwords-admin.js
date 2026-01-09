/**
 * Reset user passwords using Supabase Admin API
 * This script uses the SERVICE_ROLE_KEY to reset passwords
 * Run with: node scripts/reset-passwords-admin.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
// You'll need to add SUPABASE_SERVICE_ROLE_KEY to your .env file
// or get it from Supabase dashboard > Settings > API
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('❌ Missing VITE_SUPABASE_URL in .env file');
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env file');
  console.error('\n📝 To get the service role key:');
  console.error('   1. Go to https://supabase.com/dashboard/project/ynatuiwdvkxcmmnmejkl/settings/api');
  console.error('   2. Copy the "service_role" key');
  console.error('   3. Add it to your .env file as:');
  console.error('      SUPABASE_SERVICE_ROLE_KEY="your-key-here"');
  process.exit(1);
}

console.log('🔑 Password Reset Script (Admin API)');
console.log('====================================\n');

// Create admin client with service role key
const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetPasswords() {
  try {
    // Get user IDs
    console.log('Step 1: Finding users...');
    const { data: { users }, error: listError } = await adminSupabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Failed to list users:', listError.message);
      return;
    }

    const targetEmails = [
      'admin@haldeki.com',
      'superadmin@test.haldeki.com',
      'supplier-approved@test.haldeki.com'
    ];

    const targetUsers = users.filter(u => targetEmails.includes(u.email));

    if (targetUsers.length === 0) {
      console.error('❌ No target users found!');
      console.log('\nAvailable users:');
      users.forEach(u => console.log('  -', u.email));
      return;
    }

    console.log(`✅ Found ${targetUsers.length} target users:\n`);

    // Reset passwords
    const newPassword = 'Haldeki2025!';

    for (const user of targetUsers) {
      console.log(`Resetting password for: ${user.email}`);
      console.log(`  User ID: ${user.id}`);

      const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
      );

      if (updateError) {
        console.error(`  ❌ Failed: ${updateError.message}`);
      } else {
        console.log(`  ✅ Password reset successful!`);
        console.log(`  New password: ${newPassword}`);
      }
      console.log();
    }

    // Confirm emails
    console.log('Step 2: Confirming emails...');
    for (const user of targetUsers) {
      if (!user.email_confirmed_at) {
        console.log(`Confirming email for: ${user.email}`);
        const { error: confirmError } = await adminSupabase.auth.admin.updateUserById(
          user.id,
          { email_confirm: true }
        );

        if (confirmError) {
          console.error(`  ❌ Failed: ${confirmError.message}`);
        } else {
          console.log(`  ✅ Email confirmed!`);
        }
      } else {
        console.log(`${user.email} - already confirmed ✅`);
      }
      console.log();
    }

    console.log('====================================');
    console.log('✅ Password reset complete!\n');
    console.log('📝 New credentials:');
    console.log(`   Password: ${newPassword}`);
    console.log('\n   Users:');
    targetUsers.forEach(u => console.log(`   - ${u.email}`));
    console.log('\n⚠️  CHANGE THESE PASSWORDS IMMEDIATELY AFTER LOGIN!\n');

  } catch (error) {
    console.error('❌ Password reset failed:', error.message);
    console.error(error);
  }
}

resetPasswords();
