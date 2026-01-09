/**
 * Diagnostic script to check Supabase authentication and database access
 * Run with: node scripts/diagnose-login-issue.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

console.log('🔍 Supabase Login Issue Diagnostic');
console.log('=================================\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runDiagnostics() {
  try {
    // Test 1: Check if Supabase is accessible
    console.log('Test 1: Checking Supabase connection...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('❌ Cannot connect to Supabase:', sessionError.message);
      return;
    }
    console.log('✅ Supabase connection successful\n');

    // Test 2: Try to login with test user
    console.log('Test 2: Attempting login with admin@haldeki.com...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@haldeki.com',
      password: 'ChangeMe123!'
    });

    if (signInError) {
      console.error('❌ Login failed:', signInError.message);
      console.error('   Error details:', JSON.stringify(signInError, null, 2));
      return;
    }

    console.log('✅ Login successful!');
    console.log('   User ID:', signInData.user.id);
    console.log('   Email:', signInData.user.email);
    console.log('   Email confirmed:', signInData.user.email_confirmed_at ? '✅' : '❌');
    console.log();

    // Test 3: Check if user_roles table is accessible
    console.log('Test 3: Checking user_roles table access...');
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', signInData.user.id);

    if (rolesError) {
      console.error('❌ Cannot query user_roles:', rolesError.message);
      console.error('   Error details:', JSON.stringify(rolesError, null, 2));
      console.error('\n   📝 This is likely the issue! RLS policies may be blocking access.');
    } else {
      console.log('✅ user_roles query successful!');
      console.log('   Roles found:', rolesData.length);
      rolesData.forEach(role => {
        console.log('   -', role.role);
      });
    }
    console.log();

    // Test 4: Check if profiles table is accessible
    console.log('Test 4: Checking profiles table access...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Cannot query profiles:', profileError.message);
      console.error('   Error details:', JSON.stringify(profileError, null, 2));
    } else {
      console.log('✅ profiles query successful!');
      console.log('   Profile:', profileData ? 'Found' : 'Not found');
      if (profileData) {
        console.log('   - Name:', profileData.full_name);
        console.log('   - Phone:', profileData.phone || 'Not set');
      }
    }
    console.log();

    // Test 5: Check RLS policies
    console.log('Test 5: Checking if RLS is enabled...');
    console.log('   (This requires admin access, skipping for now)');
    console.log();

    // Test 6: Logout
    console.log('Test 6: Logging out...');
    await supabase.auth.signOut();
    console.log('✅ Logged out successfully\n');

    console.log('=================================');
    console.log('✅ Diagnostic complete!');

  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
    console.error(error);
  }
}

runDiagnostics();
