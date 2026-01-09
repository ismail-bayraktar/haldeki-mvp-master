#!/usr/bin/env node
/**
 * Verify Expected Accounts Exist
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Expected accounts
const EXPECTED_ACCOUNTS = [
  'admin@haldeki.com',
  'superadmin@test.haldeki.com',
  'supplier-approved@test.haldeki.com'
];

async function main() {
  console.log('🔍 Verifying Expected Accounts');
  console.log('================================\n');

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('❌ Error listing users:', listError.message);
    process.exit(1);
  }

  console.log('Expected Accounts Status:\n');

  let allFound = true;

  for (const email of EXPECTED_ACCOUNTS) {
    const user = users.find(u => u.email === email);

    if (user) {
      console.log(`✅ ${email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Email Confirmed: ${user.email_confirmed_at ? '✅' : '❌'}`);
      console.log(`   Last Sign In: ${user.last_sign_in_at || 'Never'}`);
    } else {
      console.log(`❌ ${email} - NOT FOUND`);
      allFound = false;
    }
    console.log();
  }

  // Check for any other test accounts
  const otherTestAccounts = users.filter(u =>
    u.email &&
    u.email.endsWith('@test.haldeki.com') &&
    !EXPECTED_ACCOUNTS.includes(u.email)
  );

  if (otherTestAccounts.length > 0) {
    console.log('⚠️  Unexpected test accounts found:\n');
    otherTestAccounts.forEach(u => console.log(`   - ${u.email}`));
    console.log();
    allFound = false;
  } else {
    console.log('✅ No unexpected test accounts found\n');
  }

  // Summary
  console.log('================================');
  if (allFound) {
    console.log('✅ All expected accounts verified!');
    console.log('✅ No unexpected test accounts found!');
  } else {
    console.log('❌ Verification failed - see details above');
  }
  console.log('================================\n');
}

main().catch(console.error);
