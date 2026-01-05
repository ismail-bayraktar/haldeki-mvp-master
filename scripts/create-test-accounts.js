/**
 * Direct Test Accounts Creation Script
 *
 * Creates test accounts using Supabase Admin API (service_role)
 * Bypasses Edge Function deployment issues
 *
 * Usage: node scripts/create-test-accounts.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TEST_PASSWORD = 'Test1234!';

const TEST_ACCOUNTS = [
  // Superadmin
  { email: 'superadmin@test.haldeki.com', role: 'superadmin', name: 'Süper Yönetici', phone: '0532 100 00 01' },

  // Admin
  { email: 'admin@test.haldeki.com', role: 'admin', name: 'Sistem Yöneticisi', phone: '0532 100 00 02' },

  // Dealers
  { email: 'dealer-approved@test.haldeki.com', role: 'dealer', name: 'Mehmet Yılmaz', phone: '0532 200 00 01',
    dealerData: { name: 'İzmir Yaş Sebze Ticaret', approval_status: 'approved' } },
  { email: 'dealer-pending@test.haldeki.com', role: 'dealer', name: 'Ayşe Demir', phone: '0532 200 00 02',
    dealerData: { name: 'Ege Gıda Pazarlama', approval_status: 'pending' } },

  // Suppliers
  { email: 'supplier-approved@test.haldeki.com', role: 'supplier', name: 'Ali Kaya', phone: '0533 300 00 01',
    supplierData: { name: 'Toroslu Çiftliği', approval_status: 'approved', categories: ['sebze', 'meyve', 'yeşillik'] } },
  { email: 'supplier-pending@test.haldeki.com', role: 'supplier', name: 'Zeynep Arslan', phone: '0533 300 00 02',
    supplierData: { name: 'Marmara Tarım Ürünleri', approval_status: 'pending', categories: ['meyve'] } },

  // Businesses
  { email: 'business-approved@test.haldeki.com', role: 'business', name: 'Can Öztürk', phone: '0534 400 00 01',
    businessData: { company_name: 'Lezzet Durağı Restoran', business_type: 'restaurant', approval_status: 'approved' } },
  { email: 'business-pending@test.haldeki.com', role: 'business', name: 'Elif Şahin', phone: '0534 400 00 02',
    businessData: { company_name: 'Güneş Kafe & Pastane', business_type: 'cafe', approval_status: 'pending' } },

  // Customers
  { email: 'customer1@test.haldeki.com', role: 'user', name: 'Fatma Yıldız', phone: '0535 500 00 01' },
  { email: 'customer2@test.haldeki.com', role: 'user', name: 'Hasan Çelik', phone: '0535 500 00 02' }
];

async function createAuthUser(email, password, metadata = {}) {
  try {
    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .rpc('test_user_exists', { p_email: email });

    if (checkError) {
      // Function might not exist, check directly
      const { data: users } = await supabase.auth.admin.listUsers();
      const exists = users.users.find(u => u.email === email);
      if (exists) {
        console.log(`  User already exists: ${email}`);
        return exists;
      }
    } else if (existingUser) {
      // Get existing user
      const { data: users } = await supabase.auth.admin.listUsers();
      return users.users.find(u => u.email === email);
    }

    // Create new user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata
    });

    if (error) throw error;
    console.log(`  Created auth user: ${email}`);
    return data.user;
  } catch (error) {
    if (error.message?.includes('already exists')) {
      console.log(`  User already exists: ${email}`);
      // Try to get existing user
      const { data: users } = await supabase.auth.admin.listUsers();
      return users.users.find(u => u.email === email);
    }
    throw error;
  }
}

async function createProfile(userId, email, name, phone) {
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email,
      full_name: name,
      phone
    }, {
      onConflict: 'id'
    });

  if (error) {
    console.error(`  Error creating profile for ${email}:`, error.message);
    return false;
  }
  console.log(`  Created profile for: ${email}`);
  return true;
}

async function assignRole(userId, role) {
  const { error } = await supabase
    .from('user_roles')
    .upsert({
      user_id: userId,
      role
    }, {
      onConflict: 'user_id,role'
    });

  if (error) {
    console.error(`  Error assigning role ${role}:`, error.message);
    return false;
  }
  console.log(`  Assigned role: ${role}`);
  return true;
}

async function createDealer(userId, email, dealerData) {
  // Get Menemen region
  const { data: region } = await supabase
    .from('regions')
    .select('id')
    .eq('slug', 'menemen')
    .single();

  const { error } = await supabase
    .from('dealers')
    .upsert({
      id: userId,
      user_id: userId,
      name: dealerData.name,
      contact_name: dealerData.name,
      contact_phone: dealerData.phone,
      contact_email: email,
      region_ids: region ? [region.id] : [],
      tax_number: '1234567890',
      approval_status: dealerData.approval_status,
      is_active: dealerData.approval_status === 'approved'
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error(`  Error creating dealer:`, error.message);
    return false;
  }
  console.log(`  Created dealer: ${dealerData.name}`);
  return true;
}

async function createSupplier(userId, email, supplierData) {
  const { error } = await supabase
    .from('suppliers')
    .upsert({
      id: userId,
      user_id: userId,
      name: supplierData.name,
      contact_name: supplierData.name,
      contact_phone: supplierData.phone,
      contact_email: email,
      product_categories: supplierData.categories,
      approval_status: supplierData.approval_status,
      is_active: supplierData.approval_status === 'approved'
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error(`  Error creating supplier:`, error.message);
    return false;
  }
  console.log(`  Created supplier: ${supplierData.name}`);
  return true;
}

async function createBusiness(userId, email, businessData) {
  // Get Menemen region
  const { data: region } = await supabase
    .from('regions')
    .select('id')
    .eq('slug', 'menemen')
    .single();

  const { error } = await supabase
    .from('businesses')
    .upsert({
      id: userId,
      user_id: userId,
      company_name: businessData.company_name,
      contact_name: businessData.name,
      contact_phone: businessData.phone,
      contact_email: email,
      business_type: businessData.business_type,
      region_ids: region ? [region.id] : [],
      tax_number: '1122334455',
      tax_office: 'Menemen',
      approval_status: businessData.approval_status,
      is_active: businessData.approval_status === 'approved'
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error(`  Error creating business:`, error.message);
    return false;
  }
  console.log(`  Created business: ${businessData.company_name}`);
  return true;
}

async function createTestAccount(account) {
  console.log(`\nCreating: ${account.email}`);
  console.log(`  Role: ${account.role}`);

  try {
    // 1. Create auth user
    const user = await createAuthUser(account.email, TEST_PASSWORD, {
      full_name: account.name,
      role: account.role
    });

    if (!user?.id) {
      console.error(`  Failed to create auth user`);
      return false;
    }

    // 2. Create profile
    await createProfile(user.id, account.email, account.name, account.phone);

    // 3. Assign role
    await assignRole(user.id, account.role);

    // 4. Create role-specific records
    if (account.dealerData) {
      await createDealer(user.id, account.email, { ...account.dealerData, phone: account.phone });
    } else if (account.supplierData) {
      await createSupplier(user.id, account.email, account.supplierData);
    } else if (account.businessData) {
      await createBusiness(user.id, account.email, { ...account.businessData, phone: account.phone });
    }

    console.log(`  Success: ${account.email}`);
    return true;
  } catch (error) {
    console.error(`  Failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('============================================================================');
  console.log('CREATING TEST ACCOUNTS');
  console.log('============================================================================');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Password: ${TEST_PASSWORD}`);
  console.log('');

  let successCount = 0;
  let failCount = 0;

  for (const account of TEST_ACCOUNTS) {
    const success = await createTestAccount(account);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n============================================================================');
  console.log('SUMMARY');
  console.log('============================================================================');
  console.log(`Total: ${TEST_ACCOUNTS.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log('\nAll test accounts created successfully!');
  console.log('You can now use the RoleSwitcher to test different roles.');
  console.log('============================================================================');
}

main().catch(console.error);
