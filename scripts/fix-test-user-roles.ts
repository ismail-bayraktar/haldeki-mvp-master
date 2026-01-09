import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ynatuiwdvkxcmmnmejkl.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluYXR1aXdkdmt4Y21tbm1lamtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0NTYzMywiZXhwIjoyMDgyMzIxNjMzfQ.UZWD2y2d5pmtl-GEaWgRS3cZPcI69s4i0S7SU5V6Jnw';

const supabase = createClient(supabaseUrl, serviceKey);

const TEST_USERS = [
  { email: 'test-customer@haldeki.com', role: 'user', fullName: 'Test Müşteri' },
  { email: 'test-admin@haldeki.com', role: 'admin', fullName: 'Test Yönetici' },
  { email: 'test-superadmin@haldeki.com', role: 'superadmin', fullName: 'Test Süper Yönetici' },
  { email: 'test-dealer@haldeki.com', role: 'dealer', fullName: 'Test Bayi' },
  { email: 'test-supplier@haldeki.com', role: 'supplier', fullName: 'Test Tedarikçi' },
  { email: 'test-business@haldeki.com', role: 'business', fullName: 'Test İşletme' },
  { email: 'test-warehouse@haldeki.com', role: 'warehouse_manager', fullName: 'Test Depo Sorumlusu' },
];

async function fixTestUserRoles() {
  console.log('🔧 Fixing E2E test user roles...\n');

  for (const testUser of TEST_USERS) {
    try {
      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', testUser.email)
        .single();

      if (!profile) {
        console.log(`⚠️  ${testUser.email} - Profile not found`);
        continue;
      }

      // Delete existing roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', profile.id);

      // Insert correct role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: profile.id,
          role: testUser.role,
        });

      if (error) {
        console.error(`❌ ${testUser.email} - Failed to assign role:`, error.message);
      } else {
        console.log(`✅ ${testUser.email} → ${testUser.role} (${testUser.fullName})`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${testUser.email}:`, error);
    }
  }

  console.log('\n✨ Role assignments fixed!');
  console.log('\nTest Credentials:');
  console.log('  Email: test-{role}@haldeki.com');
  console.log('  Password: Test1234!');
}

fixTestUserRoles().catch(console.error);
