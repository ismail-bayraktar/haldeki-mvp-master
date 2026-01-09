/**
 * FIX AUTH LOGIN - Supabase Admin API Method
 *
 * This script properly resets user passwords using the Supabase Admin API.
 * This is the MOST RELIABLE method because it uses Supabase's own
 * password hashing.
 *
 * Usage:
 *   1. Make sure VITE_SUPABASE_SERVICE_ROLE_KEY is in your .env
 *   2. Run: npx tsx scripts/fix-auth-login.ts
 *
 * Get service role key from: Supabase Dashboard → Settings → API → service_role
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('❌ VITE_SUPABASE_URL is not set in .env');
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.error('❌ VITE_SUPABASE_SERVICE_ROLE_KEY is not set in .env');
  console.error('\nGet it from: Supabase Dashboard → Settings → API → service_role');
  console.error('Add to .env: VITE_SUPABASE_SERVICE_ROLE_KEY=your-key-here\n');
  process.exit(1);
}

// Create admin client with service role
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Users to fix
const usersToFix = [
  {
    email: 'admin@haldeki.com',
    newPassword: 'HaldekiAdmin2025!',
    role: 'superadmin'
  },
  {
    email: 'superadmin@test.haldeki.com',
    newPassword: 'HaldekiSuper2025!',
    role: 'superadmin'
  },
  {
    email: 'supplier-approved@test.haldeki.com',
    newPassword: 'HaldekiSupplier2025!',
    role: 'supplier'
  }
];

async function fixAuthLogin() {
  console.log('🔧 Fixing auth login issues...\n');

  for (const user of usersToFix) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📧 Processing: ${user.email}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    try {
      // Step 1: Get user by email
      console.log(`\n1️⃣  Looking up user...`);
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

      if (listError) {
        console.error(`   ❌ Error listing users:`, listError.message);
        continue;
      }

      const foundUser = users.find(u => u.email === user.email);

      if (!foundUser) {
        console.error(`   ❌ User not found: ${user.email}`);
        continue;
      }

      console.log(`   ✅ User found: ID = ${foundUser.id}`);
      console.log(`   📋 Current email_confirmed_at: ${foundUser.email_confirmed_at || 'NULL (not confirmed)'}`);

      // Step 2: Confirm email if needed
      if (!foundUser.email_confirmed_at) {
        console.log(`\n2️⃣  Confirming email...`);

        const { error: confirmError } = await supabase.auth.admin.updateUserById(
          foundUser.id,
          { email_confirm: true }
        );

        if (confirmError) {
          console.error(`   ❌ Error confirming email:`, confirmError.message);
        } else {
          console.log(`   ✅ Email confirmed successfully`);
        }
      } else {
        console.log(`\n2️⃣  Email already confirmed, skipping...`);
      }

      // Step 3: Reset password
      console.log(`\n3️⃣  Resetting password...`);
      console.log(`   🔑 New password: ${user.newPassword}`);

      const { error: passwordError } = await supabase.auth.admin.updateUserById(
        foundUser.id,
        { password: user.newPassword }
      );

      if (passwordError) {
        console.error(`   ❌ Error resetting password:`, passwordError.message);
        console.error(`   💡 Try manually in Supabase Dashboard → Authentication → Users`);
        continue;
      }

      console.log(`   ✅ Password reset successfully`);

      // Step 4: Verify user still has role
      console.log(`\n4️⃣  Verifying role assignment...`);

      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', foundUser.id);

      if (roleError) {
        console.error(`   ⚠️  Could not verify role:`, roleError.message);
      } else if (roles && roles.length > 0) {
        const roleList = roles.map(r => r.role).join(', ');
        console.log(`   ✅ User has roles: ${roleList}`);
      } else {
        console.log(`   ⚠️  No roles found for this user`);
      }

      console.log(`\n✅ User ${user.email} fixed successfully!`);

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`\n❌ Error processing ${user.email}:`, message);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎉 AUTH LOGIN FIX COMPLETE`);
  console.log(`${'='.repeat(60)}\n`);

  console.log(`📝 CREDENTIALS TO USE FOR LOGIN:\n`);

  usersToFix.forEach(user => {
    console.log(`   📧 ${user.email}`);
    console.log(`   🔑 Password: ${user.newPassword}`);
    console.log(`   🏷️  Role: ${user.role}`);
    console.log('');
  });

  console.log(`${'='.repeat(60)}`);
  console.log(`⚠️  CRITICAL SECURITY STEPS:`);
  console.log(`${'='.repeat(60)}`);
  console.log(`   1. Login immediately to verify access`);
  console.log(`   2. CHANGE ALL PASSWORDS after first login`);
  console.log(`   3. Enable MFA (Multi-Factor Authentication)`);
  console.log(`   4. Test all user roles and permissions`);
  console.log(`   5. Review audit logs for suspicious activity`);
  console.log(`${'='.repeat(60)}\n`);

  // Test login
  console.log(`🧪 Testing login with new credentials...\n`);

  for (const user of usersToFix) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.newPassword
      });

      if (error) {
        console.error(`   ❌ ${user.email}: Login failed - ${error.message}`);
      } else {
        console.log(`   ✅ ${user.email}: Login SUCCESS!`);

        // Sign out immediately
        await supabase.auth.signOut();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`   ❌ ${user.email}: Login error - ${message}`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ FIX VERIFICATION COMPLETE`);
  console.log(`${'='.repeat(60)}\n`);
}

// Run the fix
fixAuthLogin().catch(console.error);
