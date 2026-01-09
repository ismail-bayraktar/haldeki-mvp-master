/**
 * Create Aliğa & Menemen Supplier User Accounts
 *
 * This script creates user accounts via Supabase Auth API
 * and updates the suppliers table with the correct user_id
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Supplier user credentials
const suppliers = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'supplier-aliaga@haldeki.com',
    password: 'Supplier123!',
    name: 'Aliğa Toptancı',
    contact_name: 'Ahmet Yılmaz',
    contact_phone: '+905551234567',
    region_slug: 'aliaga'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'supplier-menemen@haldeki.com',
    password: 'Supplier123!',
    name: 'Menemen Toptancı',
    contact_name: 'Mehmet Demir',
    contact_phone: '+905557654321',
    region_slug: 'menemen'
  }
];

async function createSupplierUsers() {
  console.log('🚀 Starting Aliğa & Menemen supplier user creation...\n');

  for (const supplier of suppliers) {
    console.log(`\n📦 Processing: ${supplier.name}`);
    console.log(`   Email: ${supplier.email}`);

    try {
      // Step 1: Create user via Auth API
      console.log('   → Creating auth user...');
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: supplier.email,
        password: supplier.password,
        email_confirm: true,
        user_metadata: {
          name: supplier.name,
          role: 'supplier',
          region: supplier.region_slug
        }
      });

      if (userError) {
        // Check if user already exists
        if (userError.message.includes('already been registered')) {
          console.log('   ⚠️  User already exists, fetching existing user...');

          // Get existing user by email
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existingUser = existingUsers.users.find(u => u.email === supplier.email);

          if (!existingUser?.id) {
            throw new Error('Failed to find existing user');
          }

          console.log(`   ✅ Found existing user ID: ${existingUser.id}`);

          // Update supplier record with existing user ID
          const { error: updateError } = await supabase
            .from('suppliers')
            .update({ user_id: existingUser.id })
            .eq('id', supplier.id);

          if (updateError) {
            console.error(`   ❌ Error updating supplier: ${updateError.message}`);
            continue;
          }

          console.log(`   ✅ Updated supplier.user_id`);
        } else {
          throw userError;
        }
      } else {
        console.log(`   ✅ Created auth user: ${userData.user.id}`);

        // Step 2: Update supplier record with user_id
        console.log('   → Updating supplier.user_id...');
        const { error: updateError } = await supabase
          .from('suppliers')
          .update({ user_id: userData.user.id })
          .eq('id', supplier.id);

        if (updateError) {
          throw updateError;
        }

        console.log(`   ✅ Updated supplier.user_id`);
      }

      // Step 3: Get user_id from suppliers table
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('user_id')
        .eq('id', supplier.id)
        .single();

      if (!supplierData?.user_id) {
        throw new Error('Failed to get supplier.user_id');
      }

      // Step 4: Assign supplier role
      console.log('   → Assigning supplier role...');
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: supplierData.user_id,
          role: 'supplier',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (roleError) {
        console.error(`   ⚠️  Warning: Could not assign role: ${roleError.message}`);
      } else {
        console.log('   ✅ Assigned supplier role');
      }

      // Step 5: Grant region access
      console.log(`   → Granting access to ${supplier.region_slug} region...`);

      // Get region ID
      const { data: regionData } = await supabase
        .from('regions')
        .select('id')
        .eq('slug', supplier.region_slug)
        .single();

      if (!regionData?.id) {
        throw new Error(`Region not found: ${supplier.region_slug}`);
      }

      // Grant region access
      const { error: accessError } = await supabase
        .from('user_region_access')
        .upsert({
          user_id: supplierData.user_id,
          region_id: regionData.id,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,region_id'
        });

      if (accessError) {
        console.error(`   ⚠️  Warning: Could not grant region access: ${accessError.message}`);
      } else {
        console.log(`   ✅ Granted access to ${supplier.region_slug} region`);
      }

      console.log(`\n   ✨ ${supplier.name} setup complete!`);
      console.log(`   🔑 Login: ${supplier.email}`);
      console.log(`   🔒 Password: ${supplier.password}\n`);

    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}\n`);
    }
  }

  console.log('\n✅ Supplier user creation complete!\n');

  // Verification
  console.log('📊 Verification:\n');

  const { data: suppliersData, error: suppliersError } = await supabase
    .from('suppliers')
    .select('id, name, contact_email, user_id')
    .in('id', ['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'])
    .order('name');

  if (suppliersError) {
    console.error('❌ Error fetching suppliers:', suppliersError.message);
  } else {
    suppliersData?.forEach(supplier => {
      console.log(`📦 ${supplier.name}`);
      console.log(`   Email: ${supplier.contact_email}`);
      console.log(`   User ID: ${supplier.user_id || 'NOT SET'}\n`);
    });
  }
}

// Run the script
createSupplierUsers()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
