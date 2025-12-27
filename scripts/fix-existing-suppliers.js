/**
 * Mevcut supplier rolü olan ama suppliers tablosunda kaydı olmayan kullanıcıları düzeltir
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

async function fixExistingSuppliers() {
  console.log('🔄 Supplier kayıtları kontrol ediliyor...\n');

  // Supplier rolü olan kullanıcıları bul
  const { data: supplierRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'supplier');

  if (rolesError) {
    console.error('Rol sorgusu hatası:', rolesError);
    return;
  }

  console.log(`📋 ${supplierRoles?.length || 0} supplier rolü bulundu`);

  // Her supplier için kontrol et
  for (const role of (supplierRoles || [])) {
    // suppliers tablosunda kayıt var mı?
    const { data: existingSupplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('user_id', role.user_id)
      .single();

    if (!existingSupplier) {
      console.log(`⚠️ Eksik supplier kaydı: ${role.user_id}`);
      
      // Kullanıcı bilgilerini al
      const { data: userData } = await supabase.auth.admin.getUserById(role.user_id);
      
      if (userData?.user) {
        const user = userData.user;
        
        // Suppliers tablosuna ekle
        const { error: insertError } = await supabase
          .from('suppliers')
          .insert({
            id: user.id,
            user_id: user.id,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Bilinmiyor',
            contact_name: user.user_metadata?.full_name || '',
            contact_email: user.email,
            product_categories: [],
            approval_status: 'approved', // Zaten rol verilmiş, onaylı say
            is_active: true,
          });

        if (insertError) {
          console.error(`❌ Ekleme hatası (${user.email}):`, insertError.message);
        } else {
          console.log(`✅ Supplier kaydı oluşturuldu: ${user.email}`);
        }
      }
    } else {
      console.log(`✅ Supplier kaydı mevcut: ${role.user_id}`);
    }
  }

  console.log('\n✅ İşlem tamamlandı!');
}

fixExistingSuppliers().catch(console.error);

