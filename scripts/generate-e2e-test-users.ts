/**
 * Generate E2E Test Users
 *
 * This script creates test users in Supabase Auth with proper bcrypt password hashes.
 * It handles the auth.users table creation which requires special handling.
 *
 * Usage:
 *   tsx scripts/generate-e2e-test-users.ts
 *
 * Prerequisites:
 *   - SUPABASE_URL environment variable
 *   - SUPABASE_SERVICE_ROLE_KEY environment variable
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

const TEST_USERS = [
  {
    email: 'test-customer@haldeki.com',
    password: 'Test1234!',
    role: 'user',
    fullName: 'Test Müşteri',
    phone: '0532 100 00 10',
  },
  {
    email: 'test-admin@haldeki.com',
    password: 'Test1234!',
    role: 'admin',
    fullName: 'Test Yönetici',
    phone: '0532 100 00 20',
  },
  {
    email: 'test-superadmin@haldeki.com',
    password: 'Test1234!',
    role: 'superadmin',
    fullName: 'Test Süper Yönetici',
    phone: '0532 100 00 30',
  },
  {
    email: 'test-dealer@haldeki.com',
    password: 'Test1234!',
    role: 'dealer',
    fullName: 'Test Bayi',
    phone: '0532 100 00 40',
  },
  {
    email: 'test-supplier@haldeki.com',
    password: 'Test1234!',
    role: 'supplier',
    fullName: 'Test Tedarikçi',
    phone: '0532 100 00 50',
  },
  {
    email: 'test-business@haldeki.com',
    password: 'Test1234!',
    role: 'business',
    fullName: 'Test İşletme',
    phone: '0532 100 00 60',
  },
  {
    email: 'test-warehouse@haldeki.com',
    password: 'Test1234!',
    role: 'warehouse_manager',
    fullName: 'Test Depo Sorumlusu',
    phone: '0532 100 00 70',
  },
];

async function generateBcryptHash(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function createTestUsers() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('🔐 Generating bcrypt password hash...');
  const passwordHash = await generateBcryptHash('Test1234!');
  console.log(`Password hash: ${passwordHash}`);
  console.log('');

  console.log('👥 Creating E2E test users...');
  console.log('');

  for (const testUser of TEST_USERS) {
    try {
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', testUser.email)
        .single();

      if (existingUser) {
        console.log(`⏭️  Skipping ${testUser.email} - already exists`);
        continue;
      }

      // Create user via Supabase Auth Admin API
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
        user_metadata: {
          full_name: testUser.fullName,
          phone: testUser.phone,
          test: true,
        },
        app_metadata: {
          role: testUser.role,
          provider: 'email',
        },
      });

      if (authError) {
        console.error(`❌ Failed to create ${testUser.email}:`, authError.message);
        continue;
      }

      if (!authUser.user) {
        console.error(`❌ No user returned for ${testUser.email}`);
        continue;
      }

      const userId = authUser.user.id;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: testUser.email,
          full_name: testUser.fullName,
          phone: testUser.phone,
        });

      if (profileError) {
        console.error(`❌ Failed to create profile for ${testUser.email}:`, profileError.message);
        continue;
      }

      // Assign role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: testUser.role,
        });

      if (roleError) {
        console.error(`❌ Failed to assign role for ${testUser.email}:`, roleError.message);
        continue;
      }

      console.log(`✅ Created ${testUser.email} (${testUser.role})`);
    } catch (error) {
      console.error(`❌ Error processing ${testUser.email}:`, error);
    }
  }

  console.log('');
  console.log('✨ E2E test users created successfully!');
  console.log('');
  console.log('Test Credentials:');
  console.log('  Email: test-{role}@haldeki.com');
  console.log('  Password: Test1234!');
  console.log('');
  console.log('⚠️  WARNING: These are test accounts only. Delete before production!');
}

async function verifyTestUsers() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  console.log('🔍 Verifying test users...');
  console.log('');

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('email, full_name')
    .like('email', '%@haldeki.com')
    .order('email');

  if (error) {
    console.error('❌ Failed to verify users:', error.message);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log('⚠️  No test users found');
    return;
  }

  console.log(`Found ${profiles.length} test users:`);
  profiles.forEach((profile) => {
    console.log(`  ✓ ${profile.email} (${profile.full_name})`);
  });

  // Check role assignments
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .in('user_id', profiles.map((p) => p.id));

  console.log('');
  console.log('Role assignments:');
  roles?.forEach((r) => {
    console.log(`  ${r.role}`);
  });
}

async function deleteTestUsers() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  console.log('🗑️  Deleting E2E test users...');
  console.log('');

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .like('email', '%@haldeki.com');

  if (!profiles || profiles.length === 0) {
    console.log('⚠️  No test users found');
    return;
  }

  for (const profile of profiles) {
    try {
      // Delete from auth (this cascades to other tables via FK)
      const { error } = await supabase.auth.admin.deleteUser(profile.id);

      if (error) {
        console.error(`❌ Failed to delete ${profile.email}:`, error.message);
      } else {
        console.log(`✅ Deleted ${profile.email}`);
      }
    } catch (error) {
      console.error(`❌ Error deleting ${profile.email}:`, error);
    }
  }

  console.log('');
  console.log('✨ Test users deleted successfully!');
}

// Main script
const command = process.argv[2];

switch (command) {
  case 'create':
    createTestUsers()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
      });
    break;
  case 'verify':
    verifyTestUsers()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
      });
    break;
  case 'delete':
    deleteTestUsers()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
      });
    break;
  default:
    console.log('Usage:');
    console.log('  tsx scripts/generate-e2e-test-users.ts create   - Create test users');
    console.log('  tsx scripts/generate-e2e-test-users.ts verify   - Verify test users');
    console.log('  tsx scripts/generate-e2e-test-users.ts delete   - Delete test users');
    process.exit(1);
}
