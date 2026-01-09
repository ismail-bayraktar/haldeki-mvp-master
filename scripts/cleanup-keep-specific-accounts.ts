#!/usr/bin/env node
/**
 * Supabase Test Account Cleanup - Keep Specific Accounts
 *
 * KEEP:
 * - admin@haldeki.com (manually created, keep)
 * - superadmin@test.haldeki.com (test superadmin)
 * - supplier-approved@test.haldeki.com (test supplier)
 *
 * DELETE: All other @test.haldeki.com accounts
 *
 * Usage:
 *   node scripts/cleanup-keep-specific-accounts.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Accounts to KEEP
const KEEP_ACCOUNTS = [
  'admin@haldeki.com',
  'superadmin@test.haldeki.com',
  'supplier-approved@test.haldeki.com'
];

async function executeSQL(sql: string): Promise<any> {
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    // If exec_sql doesn't exist, use direct SQL via PostgREST
    console.error('⚠️  exec_sql not available, using direct query...');
    throw error;
  }

  return data;
}

async function main() {
  console.log('🧹 Supabase Test Account Cleanup');
  console.log('================================\n');

  // Step 1: List all test accounts
  console.log('📊 Step 1: Listing all @test.haldeki.com accounts...\n');

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('❌ Error listing users:', listError.message);
    process.exit(1);
  }

  const testAccounts = users.filter(u => u.email?.endsWith('@test.haldeki.com'));

  console.log(`Found ${testAccounts.length} test accounts:\n`);

  testAccounts.forEach(account => {
    const keep = KEEP_ACCOUNTS.includes(account.email!);
    console.log(`  ${keep ? '✅ KEEP' : '❌ DELETE'}: ${account.email} (ID: ${account.id})`);
  });

  // Step 2: Identify accounts to delete
  const toDelete = testAccounts.filter(u => !KEEP_ACCOUNTS.includes(u.email!));

  console.log(`\n🎯 Step 2: Accounts to delete: ${toDelete.length}\n`);

  if (toDelete.length === 0) {
    console.log('✅ No accounts to delete. Exiting.');
    return;
  }

  // Step 3: Confirm before deletion
  console.log('⚠️  WARNING: This will permanently delete', toDelete.length, 'accounts!');
  console.log('\nAccounts to be deleted:');
  toDelete.forEach(u => console.log(`  - ${u.email}`));
  console.log('\nPress Ctrl+C to abort, or wait 5 seconds to continue...');

  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('\n🗑️  Step 3: Deleting accounts...\n');

  let deletedCount = 0;
  let failedCount = 0;

  for (const user of toDelete) {
    try {
      // Delete from public tables first (foreign key constraints)
      await supabase.from('user_roles').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);
      await supabase.from('dealers').delete().eq('user_id', user.id);
      await supabase.from('suppliers').delete().eq('user_id', user.id);
      await supabase.from('businesses').delete().eq('user_id', user.id);
      await supabase.from('warehouse_staff').delete().eq('user_id', user.id);
      await supabase.from('whitelist_applications').delete().eq('user_id', user.id);

      // Delete from auth.users
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

      if (deleteError) {
        console.error(`  ❌ Failed to delete ${user.email}:`, deleteError.message);
        failedCount++;
      } else {
        console.log(`  ✅ Deleted: ${user.email}`);
        deletedCount++;
      }
    } catch (err: any) {
      console.error(`  ❌ Error deleting ${user.email}:`, err.message);
      failedCount++;
    }
  }

  console.log(`\n✨ Cleanup complete!`);
  console.log(`   ✅ Deleted: ${deletedCount}`);
  console.log(`   ❌ Failed: ${failedCount}`);

  // Step 4: Verify remaining accounts
  console.log('\n✅ Step 4: Verifying remaining accounts...\n');

  const { data: { users: remainingUsers } } = await supabase.auth.admin.listUsers();
  const remainingTestAccounts = remainingUsers.filter(u => u.email?.endsWith('@test.haldeki.com'));

  console.log(`Remaining test accounts (${remainingTestAccounts.length}):`);
  remainingTestAccounts.forEach(account => {
    const isKeeper = KEEP_ACCOUNTS.includes(account.email!);
    console.log(`  ${isKeeper ? '✅' : '⚠️'} ${account.email}`);
  });

  console.log('\n🎉 Expected result: 2 accounts remaining (superadmin@test.haldeki.com, supplier-approved@test.haldeki.com)');
  console.log('   Plus admin@haldeki.com (non-test domain)\n');
}

main().catch(console.error);
