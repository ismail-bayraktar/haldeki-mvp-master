#!/usr/bin/env node
/**
 * SUPERADMIN MIGRATION EXECUTION SCRIPT
 *
 * Usage:
 *   1. Set SUPABASE_DB_URL environment variable (database connection string)
 *   2. Run: node scripts/execute-superadmin-migration.js
 *
 * Get DB URL from Supabase Dashboard:
 *   Project Settings > Database > Connection String > URI
 *   Format: postgresql://postgres:[password]@[host].supabase.co:5432/postgres
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;

if (!SUPABASE_DB_URL) {
  console.error('❌ ERROR: SUPABASE_DB_URL environment variable not set');
  console.error('\n📋 Setup Instructions:');
  console.error('1. Go to: https://supabase.com/dashboard/project/epuhjrdqotyrryvkjnrp/settings/database');
  console.error('2. Scroll to "Connection String"');
  console.error('3. Copy "URI" format');
  console.error('4. Set environment variable:');
  console.error('   export SUPABASE_DB_URL="postgresql://postgres:[password]@..."');
  console.error('   OR on Windows:');
  console.error('   set SUPABASE_DB_URL=postgresql://postgres:[password]@...');
  process.exit(1);
}

async function executeMigration() {
  const client = new Client({ connectionString: SUPABASE_DB_URL });

  try {
    console.log('🔌 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Read migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260110000000_create_superadmin.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('\n📜 Executing SuperAdmin creation migration...');
    await client.query(migrationSQL);
    console.log('✅ SuperAdmin migration completed');

    // Verify SuperAdmin creation
    console.log('\n🔍 Verifying SuperAdmin account...');
    const verifyResult = await client.query(`
      SELECT
        au.id,
        au.email,
        au.email_confirmed_at,
        au.created_at,
        array_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL) as roles,
        p.full_name,
        p.phone
      FROM auth.users au
      LEFT JOIN public.user_roles ur ON ur.user_id = au.id
      LEFT JOIN public.profiles p ON p.id = au.id
      WHERE au.email = 'admin@haldeki.com'
      GROUP BY au.id, au.email, au.email_confirmed_at, au.created_at, p.full_name, p.phone
    `);

    if (verifyResult.rows.length === 0) {
      console.log('⚠️  WARNING: admin@haldeki.com not found in auth.users');
      console.log('\n📋 ACTION REQUIRED:');
      console.log('1. Create admin@haldeki.com in Supabase Dashboard');
      console.log('2. Re-run this script to assign superadmin role');
    } else {
      const admin = verifyResult.rows[0];
      console.log('✅ SuperAdmin account verified:');
      console.log('   Email:', admin.email);
      console.log('   Roles:', admin.roles || ['No roles assigned']);
      console.log('   Name:', admin.full_name);
      console.log('   Created:', admin.created_at);
    }

    // Count test accounts
    console.log('\n🔍 Checking for test accounts...');
    const testAccountsResult = await client.query(`
      SELECT COUNT(*) as count
      FROM auth.users
      WHERE
        email LIKE '%@test.haldeki.com'
        OR email LIKE '%@test.haldeki.local'
        OR email LIKE '%test@example%'
        OR email LIKE '%@test%'
        OR email IN (
          'test.bayi@haldeki.com',
          'test.tedarikci@haldeki.com',
          'test@haldeki.com',
          'admin@haldeki.local',
          'testuser@example.com'
        )
    `);

    const testCount = parseInt(testAccountsResult.rows[0].count);
    console.log(`📊 Found ${testCount} test accounts`);

    if (testCount > 0) {
      console.log('\n⚠️  Test accounts still exist. Run cleanup script:');
      console.log('   node scripts/execute-cleanup-test-accounts.js');
    }

    // Show user summary
    const userSummary = await client.query(`
      SELECT
        ur.role,
        COUNT(DISTINCT ur.user_id) as user_count
      FROM public.user_roles ur
      GROUP BY ur.role
      ORDER BY user_count DESC
    `);

    console.log('\n📊 User Role Summary:');
    userSummary.rows.forEach(row => {
      console.log(`   ${row.role}: ${row.user_count} users`);
    });

    console.log('\n✅ Migration execution completed successfully');
    console.log('\n🔐 SuperAdmin Credentials:');
    console.log('   Email: admin@haldeki.com');
    console.log('   Password: hws8WadKktlvvjO8');
    console.log('   ⚠️  CHANGE PASSWORD AFTER FIRST LOGIN');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n📋 Troubleshooting:');
    console.error('1. Check SUPABASE_DB_URL is correct');
    console.error('2. Verify database is accessible');
    console.error('3. Check migration file exists');
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run migration
console.log('🚀 Starting SuperAdmin migration execution...\n');
executeMigration()
  .then(() => {
    console.log('\n✨ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error.message);
    process.exit(1);
  });
