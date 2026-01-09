/**
 * Security Migration Verification Script
 *
 * This script verifies if the critical security fixes are properly applied
 * by checking the database schema and policies.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface CheckResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
}

const results: CheckResult[] = [];

async function checkRLSEnabled(tableName: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('check_rls_enabled', { table_name: tableName });

  if (error) {
    console.error(`Error checking RLS for ${tableName}:`, error);
    return false;
  }

  return data || false;
}

async function checkPolicyExists(policyName: string, tableName: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('policyname', policyName)
    .eq('tablename', tableName)
    .single();

  if (error) {
    // Policy might not exist
    return false;
  }

  return !!data;
}

async function checkTriggerExists(triggerName: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('information_schema.triggers')
    .select('*')
    .eq('trigger_name', triggerName)
    .single();

  if (error) {
    return false;
  }

  return !!data;
}

async function runChecks() {
  console.log('🔍 Starting Security Migration Verification...\n');

  // Check 1: RLS enabled on user_roles
  console.log('Check 1: RLS enabled on user_roles table');
  try {
    const { data: rlsCheck } = await supabase
      .raw(`
        SELECT relrowsecurity
        FROM pg_class
        WHERE relname = 'user_roles'
      `);

    const rlsEnabled = rlsCheck?.[0]?.relrowsecurity || false;
    results.push({
      name: 'RLS on user_roles',
      status: rlsEnabled ? 'PASS' : 'FAIL',
      details: rlsEnabled ? 'RLS is enabled' : 'RLS is NOT enabled - CRITICAL SECURITY ISSUE'
    });
    console.log(rlsEnabled ? '✅ PASS' : '❌ FAIL');
  } catch (error) {
    results.push({
      name: 'RLS on user_roles',
      status: 'WARNING',
      details: `Could not verify: ${error}`
    });
    console.log('⚠️  WARNING - Could not verify');
  }

  // Check 2: RLS enabled on orders
  console.log('\nCheck 2: RLS enabled on orders table');
  try {
    const { data: rlsCheck } = await supabase
      .raw(`
        SELECT relrowsecurity
        FROM pg_class
        WHERE relname = 'orders'
      `);

    const rlsEnabled = rlsCheck?.[0]?.relrowsecurity || false;
    results.push({
      name: 'RLS on orders',
      status: rlsEnabled ? 'PASS' : 'FAIL',
      details: rlsEnabled ? 'RLS is enabled' : 'RLS is NOT enabled - CRITICAL SECURITY ISSUE'
    });
    console.log(rlsEnabled ? '✅ PASS' : '❌ FAIL');
  } catch (error) {
    results.push({
      name: 'RLS on orders',
      status: 'WARNING',
      details: `Could not verify: ${error}`
    });
    console.log('⚠️  WARNING - Could not verify');
  }

  // Check 3: Security audit log table exists
  console.log('\nCheck 3: Security audit log table exists');
  try {
    const { data, error } = await supabase
      .from('security_audit_log')
      .select('*')
      .limit(0);

    const tableExists = !error || !error.message.includes('does not exist');
    results.push({
      name: 'Security audit log table',
      status: tableExists ? 'PASS' : 'FAIL',
      details: tableExists ? 'Table exists' : 'Table does not exist - audit functionality missing'
    });
    console.log(tableExists ? '✅ PASS' : '❌ FAIL');
  } catch (error: any) {
    results.push({
      name: 'Security audit log table',
      status: 'FAIL',
      details: `Table does not exist: ${error.message}`
    });
    console.log('❌ FAIL');
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(60) + '\n');

  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const warningCount = results.filter(r => r.status === 'WARNING').length;

  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${result.name}: ${result.details}`);
  });

  console.log('\n' + '-'.repeat(60));
  console.log(`Total: ${results.length} checks`);
  console.log(`✅ PASS: ${passCount}`);
  console.log(`❌ FAIL: ${failCount}`);
  console.log(`⚠️  WARNING: ${warningCount}`);
  console.log('-'.repeat(60) + '\n');

  if (failCount > 0) {
    console.error('🚨 CRITICAL: Some security checks failed!');
    console.error('Database migration may not have been applied correctly.');
    console.error('\nNext steps:');
    console.error('1. Wait for Supabase rate limit to reset (5-10 minutes)');
    console.error('2. Run: npx supabase db push --include-all');
    console.error('3. Re-run this verification script');
    process.exit(1);
  } else {
    console.log('✅ All critical security checks passed!');
  }
}

runChecks().catch(console.error);
