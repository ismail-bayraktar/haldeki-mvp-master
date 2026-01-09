#!/usr/bin/env node
/**
 * Verify User Roles
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

// Expected accounts with their expected roles
const EXPECTED_ROLES = {
  'admin@haldeki.com': ['superadmin'],
  'superadmin@test.haldeki.com': ['superadmin'],
  'supplier-approved@test.haldeki.com': ['supplier']
};

async function main() {
  console.log('🔍 Verifying User Roles');
  console.log('=======================\n');

  // Get all users with roles
  const { data: usersWithRoles, error } = await supabase
    .from('user_roles')
    .select('user_id, role');

  if (error) {
    console.error('❌ Error fetching user roles:', error.message);
    process.exit(1);
  }

  // Get profiles for email lookup
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email');

  // Create email lookup map
  const emailMap = {};
  profiles?.forEach(p => {
    emailMap[p.id] = p.email;
  });

  console.log('User Roles:\n');

  for (const expectedEmail of Object.keys(EXPECTED_ROLES)) {
    const expectedRoles = EXPECTED_ROLES[expectedEmail];
    const userRecords = usersWithRoles.filter(u => emailMap[u.user_id] === expectedEmail);

    if (userRecords.length > 0) {
      const actualRoles = userRecords.map(u => u.role);
      const hasAllRoles = expectedRoles.every(r => actualRoles.includes(r));

      console.log(`${expectedEmail}:`);
      console.log(`  Expected: ${expectedRoles.join(', ')}`);
      console.log(`  Actual: ${actualRoles.join(', ')}`);
      console.log(`  Status: ${hasAllRoles ? '✅' : '❌ Missing roles'}`);
    } else {
      console.log(`${expectedEmail}:`);
      console.log(`  Expected: ${expectedRoles.join(', ')}`);
      console.log(`  Actual: No roles found`);
      console.log(`  Status: ❌ Missing all roles`);
    }
    console.log();
  }

  // Check for any unexpected test accounts with roles
  const unexpectedUsers = usersWithRoles.filter(u => {
    const email = emailMap[u.user_id];
    return email &&
      email.endsWith('@test.haldeki.com') &&
      !Object.keys(EXPECTED_ROLES).includes(email);
  });

  if (unexpectedUsers.length > 0) {
    console.log('⚠️  Unexpected test accounts with roles:\n');
    unexpectedUsers.forEach(u => {
      console.log(`  - ${emailMap[u.user_id]} (${u.role})`);
    });
  } else {
    console.log('✅ No unexpected test accounts with roles\n');
  }
}

main().catch(console.error);
