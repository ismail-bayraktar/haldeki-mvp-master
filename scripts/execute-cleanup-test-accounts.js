#!/usr/bin/env node
/**
 * TEST ACCOUNTS CLEANUP SCRIPT
 *
 * Usage:
 *   1. Set SUPABASE_DB_URL environment variable (database connection string)
 *   2. Run: node scripts/execute-cleanup-test-accounts.js
 *
 * WARNING: This will PERMANENTLY delete all test accounts
 */

const { Client } = require('pg');

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;

if (!SUPABASE_DB_URL) {
  console.error('❌ ERROR: SUPABASE_DB_URL environment variable not set');
  console.error('\n📋 Setup Instructions:');
  console.error('1. Go to: https://supabase.com/dashboard/project/epuhjrdqotyrryvkjnrp/settings/database');
  console.error('2. Scroll to "Connection String"');
  console.error('3. Copy "URI" format');
  console.error('4. Set environment variable:');
  console.error('   export SUPABASE_DB_URL="postgresql://postgres:[password]@..."');
  process.exit(1);
}

async function cleanupTestAccounts() {
  const client = new Client({ connectionString: SUPABASE_DB_URL });

  try {
    console.log('🔌 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Start transaction
    console.log('\n🔄 Starting transaction...');
    await client.query('BEGIN');

    // Backup test accounts
    console.log('📦 Creating backup of test accounts...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.deleted_test_accounts_backup_20250109 AS
      SELECT
        au.id as user_id,
        au.email,
        au.created_at,
        au.last_sign_in_at,
        au.email_confirmed_at,
        array_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL) as roles,
        p.full_name,
        NOW() as deleted_at
      FROM auth.users au
      LEFT JOIN public.profiles p ON p.id = au.id
      LEFT JOIN public.user_roles ur ON ur.user_id = au.id
      WHERE
        au.email LIKE '%@test.haldeki.com'
        OR au.email LIKE '%@test.haldeki.local'
        OR au.email LIKE '%test@example%'
        OR au.email LIKE '%@test%'
        OR au.email IN (
          'test.bayi@haldeki.com',
          'test.tedarikci@haldeki.com',
          'test@haldeki.com',
          'admin@haldeki.local',
          'testuser@example.com'
        )
      GROUP BY au.id, au.email, au.created_at, au.last_sign_in_at, au.email_confirmed_at, p.full_name
    `);

    // Get count before deletion
    const countResult = await client.query(`
      SELECT COUNT(*) as count FROM public.deleted_test_accounts_backup_20250109
    `);
    const deleteCount = parseInt(countResult.rows[0].count);

    console.log(`📊 Found ${deleteCount} test accounts to delete`);

    if (deleteCount === 0) {
      console.log('✅ No test accounts found - cleanup complete');
      await client.query('COMMIT');
      return;
    }

    // Show preview
    console.log('\n📋 Test accounts to be deleted:');
    const previewResult = await client.query(`
      SELECT
        email,
        full_name,
        roles,
        last_sign_in_at,
        email_confirmed_at
      FROM public.deleted_test_accounts_backup_20250109
      ORDER BY created_at DESC
      LIMIT 10
    `);

    previewResult.rows.forEach(row => {
      console.log(`   - ${row.email} (${row.roles?.join(', ') || 'no roles'})`);
    });

    if (deleteCount > 10) {
      console.log(`   ... and ${deleteCount - 10} more`);
    }

    // Delete from dependent tables
    console.log('\n🗑️  Deleting from dependent tables...');

    const tables = [
      'public.warehouse_staff',
      'public.whitelist_applications',
      'public.businesses',
      'public.suppliers',
      'public.dealers',
      'public.user_roles',
      'public.profiles'
    ];

    for (const table of tables) {
      const result = await client.query(`
        DELETE FROM ${table}
        WHERE user_id IN (
          SELECT id FROM auth.users
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
        )
      `);
      console.log(`   ${table}: ${result.rowCount} rows deleted`);
    }

    // Delete from auth.users
    console.log('\n🗑️  Deleting from auth.users...');
    const authDeleteResult = await client.query(`
      DELETE FROM auth.users
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
    console.log(`   auth.users: ${authDeleteResult.rowCount} rows deleted`);

    // Verify deletion
    const verifyResult = await client.query(`
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

    const remainingCount = parseInt(verifyResult.rows[0].count);

    // Commit transaction
    await client.query('COMMIT');
    console.log('\n✅ Transaction committed');

    // Show results
    console.log('\n📊 Cleanup Results:');
    console.log(`   Total deleted: ${deleteCount} accounts`);
    console.log(`   Remaining: ${remainingCount} accounts`);

    if (remainingCount === 0) {
      console.log('\n✅ SUCCESS: All test accounts deleted');
    } else {
      console.log('\n⚠️  WARNING: Some test accounts remain');
    }

    // Show remaining users
    const remainingUsers = await client.query(`
      SELECT
        au.email,
        array_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL) as roles
      FROM auth.users au
      LEFT JOIN public.user_roles ur ON ur.user_id = au.id
      GROUP BY au.id, au.email
      ORDER BY au.email
      LIMIT 20
    `);

    console.log('\n👥 Remaining users (showing first 20):');
    remainingUsers.rows.forEach(row => {
      const roles = row.roles?.join(', ') || 'no roles';
      console.log(`   - ${row.email} (${roles})`);
    });

    console.log('\n📦 Backup saved to: public.deleted_test_accounts_backup_20250109');
    console.log('   Review and drop after 30 days if no issues:');
    console.log('   DROP TABLE IF EXISTS public.deleted_test_accounts_backup_20250109;');

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    console.error('🔄 Rolling back transaction...');
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run cleanup
console.log('🚀 Starting test accounts cleanup...\n');
console.log('⚠️  WARNING: This will permanently delete test accounts');
console.log('   Press Ctrl+C to abort within 5 seconds...\n');

setTimeout(() => {
  cleanupTestAccounts()
    .then(() => {
      console.log('\n✨ Cleanup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Cleanup failed:', error.message);
      process.exit(1);
    });
}, 5000);
