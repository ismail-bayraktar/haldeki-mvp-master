import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nAdd these to your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const testUsers = [
  { email: 'superadmin@test.haldeki.com', password: 'Test1234!', role: 'superadmin', full_name: 'Sper Ynetici', phone: '0532 100 00 01' },
  { email: 'admin@test.haldeki.com', password: 'Test1234!', role: 'admin', full_name: 'Sistem Ynetici', phone: '0532 100 00 02' },
  { email: 'supplier-approved@test.haldeki.com', password: 'Test1234!', role: 'supplier', full_name: 'Ali Kaya', phone: '0532 100 00 03' },
  { email: 'dealer-approved@test.haldeki.com', password: 'Test1234!', role: 'dealer', full_name: 'Mehmet Ylmaz', phone: '0532 100 00 04' },
  { email: 'business-approved@test.haldeki.com', password: 'Test1234!', role: 'business', full_name: 'Can Holding', phone: '0532 100 00 05' },
];

async function createTestUsers() {
  for (const user of testUsers) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { full_name: user.full_name, role: user.role },
      });

      if (authError) {
        console.error(`Failed to create ${user.email}:`, authError.message);
        continue;
      }

      const userId = authData.user.id;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: userId, email: user.email, full_name: user.full_name, phone: user.phone });

      if (profileError) {
        console.error(`Failed to create profile for ${user.email}:`, profileError.message);
      }

      // Create role
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: user.role });

      if (roleError) {
        console.error(`Failed to assign role for ${user.email}:`, roleError.message);
      }

      // Create supplier/dealer/business record if applicable
      if (user.role === 'supplier') {
        const { error: supplierError } = await supabase
          .from('suppliers')
          .insert({ id: userId, user_id: userId, name: user.full_name, contact_name: user.full_name, contact_phone: user.phone, approval_status: 'approved' });
        if (supplierError) console.error('Supplier error:', supplierError.message);
      } else if (user.role === 'dealer') {
        const { error: dealerError } = await supabase
          .from('dealers')
          .insert({ id: userId, user_id: userId, name: user.full_name, contact_name: user.full_name, contact_phone: user.phone, is_active: true });
        if (dealerError) console.error('Dealer error:', dealerError.message);
      } else if (user.role === 'business') {
        const { error: businessError } = await supabase
          .from('businesses')
          .insert({ id: userId, user_id: userId, name: user.full_name, contact_name: user.full_name, contact_phone: user.phone, is_active: true });
        if (businessError) console.error('Business error:', businessError.message);
      }

      console.log(`✓ Created ${user.email}`);
    } catch (err) {
      console.error(`Error creating ${user.email}:`, err);
    }
  }
}

createTestUsers();
