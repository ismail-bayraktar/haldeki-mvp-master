// ============================================================================
// VERIFY AUTH SYSTEM - Production Recovery Verification
// ============================================================================
// This script verifies the Supabase auth system and checks user status
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('VITE_SUPABASE_SERVICE_ROLE_KEY:', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  console.error('VITE_SUPABASE_PUBLISHABLE_KEY:', process.env.VITE_SUPABASE_PUBLISHABLE_KEY ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface UserCheck {
  email: string;
  exists: boolean;
  id?: string;
  profile?: boolean;
  role?: string;
  details?: any;
}

async function verifyAuthSystem() {
  console.log('🔍 Verifying Supabase Auth System\n');
  console.log('====================================\n');

  const criticalUsers = [
    'admin@haldeki.com',
    'superadmin@test.haldeki.com',
    'supplier-approved@test.haldeki.com'
  ];

  const results: UserCheck[] = [];

  // Check each user
  for (const email of criticalUsers) {
    console.log(`Checking: ${email}`);

    // Check auth.users (requires service role)
    const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.log(`  ❌ Auth error: ${authError.message}`);
      results.push({ email, exists: false });
      continue;
    }

    const user = authUser.users.find(u => u.email === email);
    const exists = !!user;

    console.log(`  Auth user: ${exists ? '✓' : '✗'}`);

    if (exists) {
      // Check profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const hasProfile = !!profile && !profileError;
      console.log(`  Profile: ${hasProfile ? '✓' : '✗'}`);

      // Check role
      const { data: role, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      const hasRole = !!role && !roleError;
      console.log(`  Role: ${hasRole ? role.role : '✗'}`);

      // Check supplier record if applicable
      if (email.includes('supplier')) {
        const { data: supplier, error: supplierError } = await supabase
          .from('suppliers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        const hasSupplier = !!supplier && !supplierError;
        console.log(`  Supplier record: ${hasSupplier ? '✓' : '✗'}`);
      }

      results.push({
        email,
        exists: true,
        id: user.id,
        profile: hasProfile,
        role: role?.role,
        details: {
          created_at: user.created_at,
          email_confirmed_at: user.email_confirmed_at,
          last_sign_in_at: user.last_sign_in_at
        }
      });
    } else {
      results.push({ email, exists: false });
    }

    console.log('');
  }

  // Summary
  console.log('====================================');
  console.log('SUMMARY');
  console.log('====================================\n');

  const existingCount = results.filter(r => r.exists).length;
  const totalCount = results.length;

  console.log(`Total critical users: ${totalCount}`);
  console.log(`Existing users: ${existingCount}`);
  console.log(`Missing users: ${totalCount - existingCount}\n`);

  if (existingCount === 0) {
    console.log('⚠️  CRITICAL: All users are missing!');
    console.log('\n🚨 ACTION REQUIRED:');
    console.log('1. Run: npx tsx scripts/recover-users.ts');
    console.log('2. Or execute SQL manually in Supabase Dashboard:\n');
    console.log('   File: supabase/migrations/20260109200000_emergency_user_recreation.sql');
  } else if (existingCount < totalCount) {
    console.log('⚠️  Some users are missing:');
    results.filter(r => !r.exists).forEach(r => {
      console.log(`  - ${r.email}`);
    });
  } else {
    console.log('✓ All critical users exist\n');

    // Check for issues
    const issues = results.filter(r => r.exists && (!r.profile || !r.role));
    if (issues.length > 0) {
      console.log('⚠️  Some users have issues:');
      issues.forEach(r => {
        console.log(`  - ${r.email}:`);
        if (!r.profile) console.log('    Missing profile');
        if (!r.role) console.log('    Missing role');
      });
    } else {
      console.log('✓ All users have profiles and roles');
    }
  }

  console.log('\n====================================');
  console.log('USER DETAILS');
  console.log('====================================\n');

  results.forEach(r => {
    if (r.exists) {
      console.log(`📧 ${r.email}`);
      console.log(`   ID: ${r.id}`);
      console.log(`   Profile: ${r.profile ? '✓' : '✗'}`);
      console.log(`   Role: ${r.role || 'none'}`);
      if (r.details?.created_at) {
        console.log(`   Created: ${new Date(r.details.created_at).toLocaleString('tr-TR')}`);
      }
      if (r.details?.last_sign_in_at) {
        console.log(`   Last login: ${new Date(r.details.last_sign_in_at).toLocaleString('tr-TR')}`);
      }
      console.log('');
    }
  });

  // Check total user count
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 Total profiles in database: ${totalUsers || 0}`);

  // Check environment
  console.log('\n====================================');
  console.log('ENVIRONMENT CHECK');
  console.log('====================================\n');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Using service role: ${!!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY}\n`);

  if (!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
    console.log('⚠️  WARNING: VITE_SUPABASE_SERVICE_ROLE_KEY not set');
    console.log('Some operations may fail without service role privileges\n');
  }

  // Save results to file
  const reportPath = path.join(process.cwd(), 'auth-system-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    supabaseUrl,
    usingServiceRole: !!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    results,
    summary: {
      total: totalCount,
      existing: existingCount,
      missing: totalCount - existingCount
    }
  }, null, 2));

  console.log(`📄 Report saved to: ${reportPath}`);
}

verifyAuthSystem().catch(console.error);
