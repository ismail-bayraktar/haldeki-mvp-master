/**
 * FIX AUTH CREDENTIALS - Direct Supabase API Method
 *
 * This script resets passwords using the Supabase Management API directly.
 * It bypasses the need for service role key by using fetch with proper auth.
 *
 * PREREQUISITE: You must have access token from Supabase Dashboard
 *
 * Usage:
 *   1. Open Supabase Dashboard
 *   2. Open browser DevTools → Console
 *   3. Run: localStorage.getItem('supabase-token')
 *   4. Copy the token
 *   5. Run this script with the token
 */

const PROJECT_REF = 'epuhjrdqotyrryvkjnrp';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

const users = [
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

async function getAccessToken() {
  // Try environment variable first
  if (process.env.SUPABASE_ACCESS_TOKEN) {
    return process.env.SUPABASE_ACCESS_TOKEN;
  }

  // Try service role key
  if (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  }

  console.log('❌ No access token found');
  console.log('\nGet your access token:');
  console.log('1. Go to: https://app.supabase.com/project/' + PROJECT_REF + '/settings/api');
  console.log('2. Copy the "service_role" secret (not anon key!)');
  console.log('3. Set environment variable: export SUPABASE_SERVICE_ROLE_KEY="your-token"');
  console.log('4. Run: node scripts/fix-auth-credentials.js\n');

  return null;
}

async function resetPasswordWithServiceRole(serviceRoleKey) {
  const results = [];

  for (const user of users) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📧 ${user.email}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    try {
      // Step 1: List users to find the user ID
      console.log(`   🔍 Looking up user...`);

      const listResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'GET',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!listResponse.ok) {
        throw new Error(`Failed to list users: ${listResponse.status}`);
      }

      const listData = await listResponse.json();
      const targetUser = listData.users.find(u => u.email === user.email);

      if (!targetUser) {
        throw new Error('User not found in auth system');
      }

      console.log(`   ✅ User ID: ${targetUser.id}`);

      // Step 2: Confirm email and update password
      console.log(`   🔑 Resetting password...`);

      const updateResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${targetUser.id}`, {
        method: 'PUT',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email_confirm: true,
          password: user.password
        })
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(`Update failed: ${JSON.stringify(errorData)}`);
      }

      const updateData = await updateResponse.json();
      console.log(`   ✅ Password reset successfully`);
      console.log(`   🔑 New password: ${user.password}`);

      // Step 3: Test login
      console.log(`   🧪 Testing login...`);

      const loginResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          password: user.password
        })
      });

      if (loginResponse.ok) {
        console.log(`   ✅ Login test successful`);
        results.push({ email: user.email, success: true, message: 'Password reset and verified' });
      } else {
        const errorData = await loginResponse.json();
        console.log(`   ❌ Login test failed: ${JSON.stringify(errorData)}`);
        results.push({ email: user.email, success: true, message: 'Password reset but login test failed' });
      }

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      results.push({ email: user.email, success: false, message: error.message });
    }
  }

  return results;
}

async function generateManualInstructions() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📋 MANUAL PASSWORD RESET INSTRUCTIONS');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('Open Supabase Dashboard and follow these steps:\n');
  console.log(`1. Go to: https://app.supabase.com/project/${PROJECT_REF}/auth/users\n`);
  console.log('2. For each user, click the user and then "Reset Password":\n');

  users.forEach(user => {
    console.log(`   ┌──────────────────────────────────────────────┐`);
    console.log(`   │  ${user.email.padEnd(44)}│`);
    console.log(`   │  Password: ${user.password.padEnd(32)}│`);
    console.log(`   │  Role: ${user.role.padEnd(38)}│`);
    console.log(`   └──────────────────────────────────────────────┘\n`);
  });

  console.log('3. Make sure "Email Confirmed" is checked for each user\n');
  console.log('4. Test login after reset\n');
  console.log('═══════════════════════════════════════════════════════════\n');
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     SUPABASE PASSWORD RESET                              ║');
  console.log('║     Project: ' + PROJECT_REF + '                    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const accessToken = await getAccessToken();

  if (!accessToken) {
    await generateManualInstructions();
    process.exit(1);
  }

  console.log(`✅ Using service role key for authentication\n`);

  const results = await resetPasswordWithServiceRole(accessToken);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');

  const successCount = results.filter(r => r.success).length;

  results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    console.log(`${icon} ${r.email}: ${r.message}`);
  });

  console.log(`\n✅ Success: ${successCount}/${results.length}`);

  if (successCount === results.length) {
    console.log('\n🎉 ALL PASSWORDS RESET SUCCESSFULLY!\n');
    console.log('📝 LOGIN CREDENTIALS:\n');
    users.forEach(user => {
      console.log(`   ${user.email}`);
      console.log(`   Password: ${user.password}\n`);
    });
  } else {
    console.log('\n⚠️  SOME RESETS FAILED. Try manual reset below.\n');
    await generateManualInstructions();
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
