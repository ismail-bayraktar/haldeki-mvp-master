/**
 * INTERACTIVE PASSWORD RESET SCRIPT
 *
 * This script provides two methods to reset passwords:
 * 1. Using Supabase CLI (recommended)
 * 2. Using service role key from environment
 *
 * Prerequisites:
 * - Supabase CLI installed: https://supabase.com/docs/reference/cli
 * - Logged in: supabase login
 * - Linked to project: supabase link --project-ref epuhjrdqotyrryvkjnrp
 */

import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';

const PROJECT_REF = 'epuhjrdqotyrryvkjnrp';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

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

async function getServiceRoleKey(): Promise<string | null> {
  // Try to get from environment first
  const envKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
                 process.env.SUPABASE_SERVICE_ROLE_KEY ||
                 process.env.SERVICE_ROLE_KEY;

  if (envKey) {
    console.log('✅ Found service role key in environment');
    return envKey;
  }

  // Try Supabase CLI
  try {
    console.log('🔍 Attempting to get service role key via Supabase CLI...');

    // Check if logged in
    execSync('supabase whoami', { stdio: 'pipe' });

    // Get access token
    const token = execSync('supabase access-tokens', { encoding: 'utf-8' }).trim();

    if (token) {
      console.log('✅ Retrieved service role key via Supabase CLI');
      return token;
    }
  } catch (error: unknown) {
    console.log('⚠️  Supabase CLI not available or not logged in');
    console.log('   Install CLI: npm install -g supabase');
    console.log('   Then run: supabase login && supabase link --project-ref ' + PROJECT_REF);
  }

  return null;
}

async function resetPasswordWithAdminAPI(serviceRoleKey: string) {
  const supabase = createClient(SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('🔧 Resetting passwords using Supabase Admin API...\n');

  const results: Array<{ email: string; success: boolean; message: string }> = [];

  for (const user of usersToReset) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📧 ${user.email}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    try {
      // Get all users
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

      if (listError) {
        throw new Error(`Failed to list users: ${listError.message}`);
      }

      const targetUser = users.find(u => u.email === user.email);

      if (!targetUser) {
        throw new Error('User not found in auth system');
      }

      console.log(`   ✅ User ID: ${targetUser.id}`);

      // Confirm email
      if (!targetUser.email_confirmed_at) {
        await supabase.auth.admin.updateUserById(
          targetUser.id,
          { email_confirm: true }
        );
        console.log(`   ✅ Email confirmed`);
      }

      // Update password
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

      console.log(`   ✅ Password reset: ${user.password}`);

      // Verify role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', targetUser.id);

      const userRoles = roles?.map(r => r.role) || [];
      console.log(`   🏷️  Roles: ${userRoles.join(', ') || 'None'}`);

      // Test login
      const testClient = createClient(SUPABASE_URL, serviceRoleKey);
      const { error: signInError } = await testClient.auth.signInWithPassword({
        email: user.email,
        password: user.password
      });

      if (signInError) {
        console.log(`   ❌ Login test failed: ${signInError.message}`);
        results.push({ email: user.email, success: false, message: signInError.message });
      } else {
        console.log(`   ✅ Login test successful`);
        await testClient.auth.signOut();
        results.push({ email: user.email, success: true, message: 'Reset complete' });
      }

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`   ❌ Error: ${message}`);
      results.push({ email: user.email, success: false, message: message });
    }

    console.log();
  }

  return results;
}

async function generateManualInstructions() {
  console.log('═'.repeat(60));
  console.log('📋 MANUAL PASSWORD RESET INSTRUCTIONS');
  console.log('═'.repeat(60));
  console.log();
  console.log('Since automatic reset is not available, follow these steps:');
  console.log();
  console.log('1. Open Supabase Dashboard:');
  console.log(`   https://app.supabase.com/project/${PROJECT_REF}/auth/users`);
  console.log();
  console.log('2. For each user, do the following:');
  console.log();

  usersToReset.forEach(user => {
    console.log(`   ┌─ ${user.email} ─────────────────────────┐`);
    console.log(`   │ • Click on the user in the list         │`);
    console.log(`   │ • Click "Reset Password"                │`);
    console.log(`   │ • Enter: ${user.padEnd(32)} │`);
    console.log(`   │ • Click "Save"                          │`);
    console.log(`   │ • Verify "Email Confirmed" is checked   │`);
    console.log(`   └─────────────────────────────────────────┘`);
    console.log();
  });

  console.log('3. Test login after reset');
  console.log();
  console.log('═══════════════════════════════════════════════\n');
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     SUPABASE PASSWORD RESET - Project: ' + PROJECT_REF + '     ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const serviceRoleKey = await getServiceRoleKey();

  if (serviceRoleKey) {
    const results = await resetPasswordWithAdminAPI(serviceRoleKey);

    console.log('═'.repeat(60));
    console.log('📊 SUMMARY');
    console.log('═'.repeat(60));

    const successCount = results.filter(r => r.success).length;

    results.forEach(r => {
      const icon = r.success ? '✅' : '❌';
      console.log(`${icon} ${r.email}: ${r.message}`);
    });

    console.log();
    console.log(`✅ Success: ${successCount}/${results.length}`);
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
      await generateManualInstructions();
      process.exit(1);
    }
  } else {
    console.log('⚠️  Cannot retrieve service role key automatically.\n');
    await generateManualInstructions();

    console.log('💡 Alternative: Add service role key to environment:');
    console.log(`   export SUPABASE_SERVICE_ROLE_KEY="your-key-here"`);
    console.log('   npx tsx scripts/reset-passwords-interactive.ts\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
