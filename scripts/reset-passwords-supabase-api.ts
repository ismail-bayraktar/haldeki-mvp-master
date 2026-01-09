/**
 * RESET PASSWORDS USING SUPABASE ADMIN API
 *
 * This script properly resets user passwords using the Supabase Admin API.
 * The issue with pre-computed bcrypt hashes is that they don't match
 * Supabase's internal hash format. This script uses the official API.
 *
 * Usage:
 *   npx tsx scripts/reset-passwords-supabase-api.ts
 *
 * Get service role key from: Supabase Dashboard → Settings → API → service_role
 */

import { createClient } from '@supabase/supabase-js';

// Configuration - using project epuhjrdqotyrryvkjnrp
const SUPABASE_URL = 'https://epuhjrdqotyrryvkjnrp.supabase.co';

// You need to set this in your environment or paste it here temporarily
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
                         process.env.SUPABASE_SERVICE_ROLE_KEY ||
                         import.meta.env?.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set');
  console.error('\nGet it from: Supabase Dashboard → Project epuhjrdqotyrryvkjnrp → Settings → API → service_role (secret)');
  console.error('Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=your-key-here\n');
  process.exit(1);
}

// Create admin client with service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Users to reset
interface UserReset {
  email: string;
  password: string;
  role: string;
}

const usersToReset: UserReset[] = [
  {
    email: 'admin@haldeki.com',
    password: 'HaldekiAdmin2025!',
    role: 'superadmin'
  },
  {
    email: 'superadmin@test.haldeki.com',
    password: 'Test1234!',
    role: 'superadmin'
  },
  {
    email: 'supplier-approved@test.haldeki.com',
    password: 'Test1234!',
    role: 'supplier'
  }
];

async function resetPasswords() {
  console.log('🔧 Resetting passwords using Supabase Admin API...\n');

  const results: Array<{ email: string; success: boolean; message: string }> = [];

  for (const user of usersToReset) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📧 ${user.email}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    try {
      // Step 1: List all users to find the target
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

      if (listError) {
        throw new Error(`Failed to list users: ${listError.message}`);
      }

      const targetUser = users.find(u => u.email === user.email);

      if (!targetUser) {
        throw new Error('User not found in auth system');
      }

      console.log(`   ✅ User found: ${targetUser.id}`);

      // Step 2: Confirm email
      if (!targetUser.email_confirmed_at) {
        const { error: confirmError } = await supabase.auth.admin.updateUserById(
          targetUser.id,
          { email_confirm: true }
        );

        if (confirmError) {
          console.warn(`   ⚠️  Could not confirm email: ${confirmError.message}`);
        } else {
          console.log(`   ✅ Email confirmed`);
        }
      } else {
        console.log(`   ✅ Email already confirmed`);
      }

      // Step 3: Update password using Admin API
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        targetUser.id,
        {
          password: user.password,
          email_confirm: true
        }
      );

      if (updateError) {
        throw new Error(`Password update failed: ${updateError.message}`);
      }

      console.log(`   ✅ Password reset successfully`);
      console.log(`   🔑 New password: ${user.password}`);

      // Step 4: Verify role in user_roles table
      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', targetUser.id);

      if (roleError) {
        console.warn(`   ⚠️  Could not verify roles: ${roleError.message}`);
      } else {
        const userRoles = roles?.map(r => r.role) || [];
        console.log(`   🏷️  Roles: ${userRoles.join(', ') || 'None'}`);

        if (userRoles.length === 0) {
          console.warn(`   ⚠️  User has no roles assigned!`);
        }
      }

      // Step 5: Test login
      const testClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      const { data: signInData, error: signInError } = await testClient.auth.signInWithPassword({
        email: user.email,
        password: user.password
      });

      if (signInError) {
        console.log(`   ❌ Login test failed: ${signInError.message}`);
        results.push({ email: user.email, success: false, message: signInError.message });
      } else {
        console.log(`   ✅ Login test successful`);
        await testClient.auth.signOut();
        results.push({ email: user.email, success: true, message: 'Password reset and login verified' });
      }

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`   ❌ Error: ${message}`);
      results.push({ email: user.email, success: false, message: message });
    }

    console.log();
  }

  // Summary
  console.log('═'.repeat(60));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(60));

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    console.log(`${icon} ${r.email}: ${r.message}`);
  });

  console.log();
  console.log(`✅ Success: ${successCount}/${results.length}`);
  console.log(`❌ Failed: ${failCount}/${results.length}`);
  console.log('═'.repeat(60));
  console.log();

  if (successCount === results.length) {
    console.log('🎉 ALL PASSWORDS RESET SUCCESSFULLY!\n');
    console.log('📝 LOGIN CREDENTIALS:\n');
    usersToReset.forEach(user => {
      console.log(`   ${user.email}`);
      console.log(`   Password: ${user.password}\n`);
    });
  } else {
    console.log('⚠️  SOME RESETS FAILED. Check errors above.\n');
    process.exit(1);
  }
}

resetPasswords().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
