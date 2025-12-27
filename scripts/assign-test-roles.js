/**
 * Test hesaplarına rol atama script'i
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function assignRoles() {
  console.log('🔄 Roller atanıyor...\n');

  // Kullanıcıları bul
  const { data: users } = await supabase.auth.admin.listUsers();
  
  const dealerUser = users?.users?.find(u => u.email === 'test.bayi@haldeki.com');
  const supplierUser = users?.users?.find(u => u.email === 'test.tedarikci@haldeki.com');

  // Bayi rolü ata
  if (dealerUser) {
    const { error } = await supabase
      .from('user_roles')
      .upsert({ user_id: dealerUser.id, role: 'dealer' }, { onConflict: 'user_id,role' });
    
    if (!error) {
      console.log('✅ Dealer rolü atandı:', dealerUser.email);
      
      // Dealers tablosuna da ekle
      await supabase.from('dealers').upsert({
        id: dealerUser.id,
        user_id: dealerUser.id,
        company_name: 'Test Bayi Ltd.',
        contact_name: 'Test Bayi',
        phone: '05551234567',
        tax_number: '1234567890',
        region_ids: [],
        approval_status: 'approved'
      }, { onConflict: 'id' });
      console.log('✅ Dealers tablosuna eklendi');
    }
  }

  // Tedarikçi rolü ata
  if (supplierUser) {
    const { error } = await supabase
      .from('user_roles')
      .upsert({ user_id: supplierUser.id, role: 'supplier' }, { onConflict: 'user_id,role' });
    
    if (!error) {
      console.log('✅ Supplier rolü atandı:', supplierUser.email);
      
      // Suppliers tablosuna da ekle
      await supabase.from('suppliers').upsert({
        id: supplierUser.id,
        user_id: supplierUser.id,
        company_name: 'Test Tedarikçi A.Ş.',
        contact_name: 'Test Tedarikçi',
        phone: '05559876543',
        product_categories: ['sebze', 'meyve'],
        approval_status: 'approved'
      }, { onConflict: 'id' });
      console.log('✅ Suppliers tablosuna eklendi');
    }
  }

  console.log('\n✅ Roller atandı! Artık test hesaplarıyla giriş yapabilirsin.');
}

assignRoles().catch(console.error);

