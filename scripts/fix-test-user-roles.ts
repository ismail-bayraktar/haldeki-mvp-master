import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Error: Missing required environment variables');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('Set them in .env.local or run with them set');
  process.exit(1);
}

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
  console.log('Fixing E2E test user roles...\n');

  for (const testUser of TEST_USERS) {
    try {
      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', testUser.email)
        .single();

      if (!profile) {
        console.log(`${testUser.email} - Profile not found`);
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
        console.error(`${testUser.email} - Failed to assign role:`, error.message);
      } else {
        console.log(`${testUser.email} -> ${testUser.role} (${testUser.fullName})`);
      }
    } catch (error: any) {
      console.error(`Error processing ${testUser.email}:`, error);
    }
  }

  console.log('\nRole assignments fixed!');
  console.log('\nTest Credentials:');
  console.log('  Email: test-{role}@haldeki.com');
  console.log('  Password: Test1234!');
}

fixTestUserRoles().catch(console.error);
