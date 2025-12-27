/**
 * Mevcut dealer rolü olan ama dealers tablosunda kaydı olmayan kullanıcıları düzeltir
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

async function fixExistingDealers() {
  console.log('🔄 Dealer kayıtları kontrol ediliyor...\n');

  // Dealer rolü olan kullanıcıları bul
  const { data: dealerRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'dealer');

  if (rolesError) {
    console.error('Rol sorgusu hatası:', rolesError);
    return;
  }

  console.log(`📋 ${dealerRoles?.length || 0} dealer rolü bulundu`);

  // Her dealer için kontrol et
  for (const role of (dealerRoles || [])) {
    // dealers tablosunda kayıt var mı?
    const { data: existingDealer } = await supabase
      .from('dealers')
      .select('id')
      .eq('user_id', role.user_id)
      .single();

    if (!existingDealer) {
      console.log(`⚠️ Eksik dealer kaydı: ${role.user_id}`);
      
      // Kullanıcı bilgilerini al
      const { data: userData } = await supabase.auth.admin.getUserById(role.user_id);
      
      if (userData?.user) {
        const user = userData.user;
        
        // Dealers tablosuna ekle
        const { error: insertError } = await supabase
          .from('dealers')
          .insert({
            id: user.id,
            user_id: user.id,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Bilinmiyor',
            contact_name: user.user_metadata?.full_name || '',
            contact_email: user.email,
            approval_status: 'approved', // Zaten rol verilmiş, onaylı say
            is_active: true,
            region_ids: [],
          });

        if (insertError) {
          console.error(`❌ Ekleme hatası (${user.email}):`, insertError.message);
        } else {
          console.log(`✅ Dealer kaydı oluşturuldu: ${user.email}`);
        }
      }
    } else {
      console.log(`✅ Dealer kaydı mevcut: ${role.user_id}`);
    }
  }

  console.log('\n✅ İşlem tamamlandı!');
}

fixExistingDealers().catch(console.error);

