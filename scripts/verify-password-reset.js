/**
 * VERIFY PASSWORD RESET - Test Login Credentials
 *
 * This script tests if the password reset was successful
 * by attempting to login with each account.
 */

const SUPABASE_URL = 'https://epuhjrdqotyrryvkjnrp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwdWhqcmRxb3R5cnJ5dmtqbnJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2Njc1NzMsImV4cCI6MjA4MjI0MzU3M30.gXZ8KusNhUOD0WSZUZNMgu1Ncg2Fafc2EX5VS2wfcU8';

const testAccounts = [
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

async function testLogin(email, password) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (!response.ok) {
    return { success: false, error: data.error_description || data.error || 'Unknown error' };
  }

  return { success: true, user: data.user };
}

async function verifyUserRole(email, accessToken) {
  // Get user profile to check roles
  const response = await fetch(`${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${(await testLogin(email, '')).user?.id}`, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  return data;
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     PASSWORD RESET VERIFICATION                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const results = [];
  let successCount = 0;

  for (const account of testAccounts) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📧 ${account.email}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    const result = await testLogin(account.email, account.password);

    if (result.success) {
      console.log(`   ✅ Login SUCCESS`);
      console.log(`   👤 User ID: ${result.user.id}`);
      console.log(`   📧 Email: ${result.user.email}`);
      console.log(`   ✅ Confirmed: ${result.user.email_confirmed_at ? 'Yes' : 'No'}`);

      successCount++;

      results.push({
        email: account.email,
        success: true,
        userId: result.user.id,
        role: account.role
      });
    } else {
      console.log(`   ❌ Login FAILED`);
      console.log(`   🔴 Error: ${result.error}`);
      console.log(`   💡 Password may not be reset yet`);
      console.log(`   💡 Use: https://app.supabase.com/project/epuhjrdqotyrryvkjnrp/auth/users`);

      results.push({
        email: account.email,
        success: false,
        error: result.error
      });
    }

    console.log();
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');

  results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    const status = r.success ? 'WORKING' : 'FAILED';
    console.log(`${icon} ${r.email}: ${status}`);
  });

  console.log(`\n✅ Success: ${successCount}/${results.length}`);

  if (successCount === results.length) {
    console.log('\n🎉 ALL PASSWORDS RESET SUCCESSFULLY!');
    console.log('   Users can now login to the application.\n');
  } else {
    console.log('\n⚠️  SOME LOGINS FAILED');
    console.log('   Please reset passwords using Supabase Dashboard:\n');
    console.log(`   https://app.supabase.com/project/epuhjrdqotyrryvkjnrp/auth/users\n`);
    console.log('   For each user:');
    console.log('   1. Click on user email');
    console.log('   2. Click "Reset Password"');
    console.log('   3. Enter new password (Test1234! or HaldekiAdmin2025!)');
    console.log('   4. Click "Save"');
    console.log('   5. Verify "Email Confirmed" is checked\n');
  }

  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
