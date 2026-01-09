/**
 * Create Whitelist Test Users
 * Phase 2: Login Logic - Whitelist Check Integration
 *
 * This script creates test users via Supabase Auth API
 * Run this before running setup-whitelist-test-data.sql
 *
 * Usage:
 *   npm run ts-node scripts/create-whitelist-test-users.ts
 *   OR
 *   npx tsx scripts/create-whitelist-test-users.ts
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test users configuration
const TEST_USERS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'test-pending@haldeki.com',
    password: 'Test123!',
    phone: '5551234567',
    full_name: 'Test Pending User',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'test-approved@haldeki.com',
    password: 'Test123!',
    phone: '5551234568',
    full_name: 'Test Approved User',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'test-rejected@haldeki.com',
    password: 'Test123!',
    phone: '5551234569',
    full_name: 'Test Rejected User',
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    email: 'test-duplicate@haldeki.com',
    password: 'Test123!',
    phone: '5551234570',
    full_name: 'Test Duplicate User',
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    email: 'test-no-whitelist@haldeki.com',
    password: 'Test123!',
    phone: '5551234571',
    full_name: 'Test No Whitelist User',
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    email: 'test-no-phone@haldeki.com',
    password: 'Test123!',
    phone: null,
    full_name: 'Test No Phone User',
  },
];

/**
 * Create a single test user
 */
async function createTestUser(user: typeof TEST_USERS[0]) {
  try {
    console.log(`\n📧 Creating user: ${user.email}`);

    // Create user via Admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      emailConfirm: true, // Auto-confirm email
      userMetadata: {
        full_name: user.full_name,
        phone: user.phone,
      },
    });

    if (error) {
      // User might already exist
      if (error.message.includes('already been registered')) {
        console.log(`  ⚠️  User already exists, skipping...`);
        return { success: true, existing: true };
      }
      throw error;
    }

    console.log(`  ✅ User created successfully`);
    console.log(`     ID: ${data.user.id}`);
    console.log(`     Email: ${data.user.email}`);

    return { success: true, existing: false, userId: data.user.id };
  } catch (error) {
    console.error(`  ❌ Error creating user:`, error);
    return { success: false, error };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('===================================');
  console.log('Whitelist Test Users Creation');
  console.log('===================================');

  let successCount = 0;
  let existingCount = 0;
  let failCount = 0;

  for (const user of TEST_USERS) {
    const result = await createTestUser(user);

    if (result.success) {
      if (result.existing) {
        existingCount++;
      } else {
        successCount++;
      }
    } else {
      failCount++;
    }
  }

  console.log('\n===================================');
  console.log('Summary');
  console.log('===================================');
  console.log(`✅ Created: ${successCount}`);
  console.log(`⚠️  Already existed: ${existingCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('\nNext steps:');
  console.log('1. Run setup-whitelist-test-data.sql to add users to database');
  console.log('2. Run whitelist-login.spec.ts to test the login flow');
  console.log('===================================\n');
}

// Run the script
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
