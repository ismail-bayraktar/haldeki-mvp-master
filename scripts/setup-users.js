/**
 * Kullanıcı Kurulum Script'i
 * 
 * Bu script:
 * 1. bayraktarismail00@gmail.com'a superadmin rolü atar
 * 2. test.bayi@haldeki.com hesabı oluşturur (dealer)
 * 3. test.tedarikci@haldeki.com hesabı oluşturur (supplier)
 * 
 * Çalıştırmak için: node scripts/setup-users.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env.local dosyasını yükle
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Hata: VITE_SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY bulunamadı!');
  console.log('\n.env.local dosyasına şu satırı ekleyin:');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.log('\nService Role Key: Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

// Admin client (service_role key ile)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Test1234!';

async function setupUsers() {
  console.log('Kullanıcı kurulumu başlıyor...\n');

  // 1. Admin kullanıcısını kontrol et ve rol ata
  console.log('1. Admin kullanıcısı kontrol ediliyor...');
  const { data: adminUser } = await supabase.auth.admin.listUsers();
  const existingAdmin = adminUser?.users?.find(u => u.email === 'bayraktarismail00@gmail.com');

  if (existingAdmin) {
    console.log('   Admin kullanıcısı mevcut:', existingAdmin.id);
    
    // Superadmin rolü ata
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({ user_id: existingAdmin.id, role: 'superadmin' }, { onConflict: 'user_id,role' });
    
    if (roleError) {
      console.log('   Rol atama hatası:', roleError.message);
    } else {
      console.log('   Superadmin rolü atandı');
    }
  } else {
    console.log('   Admin kullanıcısı bulunamadı. Önce kayıt olun: bayraktarismail00@gmail.com');
  }

  // 2. Test Bayi hesabı oluştur
  console.log('\n2. Test Bayi hesabı oluşturuluyor...');
  const { data: dealerData, error: dealerError } = await supabase.auth.admin.createUser({
    email: 'test.bayi@haldeki.com',
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: 'Test Bayi Kullanıcı' }
  });

  if (dealerError) {
    if (dealerError.message.includes('already been registered')) {
      console.log('   Test Bayi zaten kayıtlı');
    } else {
      console.log('   Hata:', dealerError.message);
    }
  } else {
    console.log('   Test Bayi oluşturuldu:', dealerData.user.id);
  }

  // 3. Test Tedarikçi hesabı oluştur
  console.log('\n3. Test Tedarikçi hesabı oluşturuluyor...');
  const { data: supplierData, error: supplierError } = await supabase.auth.admin.createUser({
    email: 'test.tedarikci@haldeki.com',
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: 'Test Tedarikçi Kullanıcı' }
  });

  if (supplierError) {
    if (supplierError.message.includes('already been registered')) {
      console.log('   Test Tedarikçi zaten kayıtlı');
    } else {
      console.log('   Hata:', supplierError.message);
    }
  } else {
    console.log('   Test Tedarikçi oluşturuldu:', supplierData.user.id);
  }

  // 4. Özet
  console.log('\n' + '='.repeat(50));
  console.log('HESAP BİLGİLERİ');
  console.log('='.repeat(50));
  console.log('\nAdmin:');
  console.log('   Email: bayraktarismail00@gmail.com');
  console.log('   Rol: superadmin');
  console.log('   (Kendi şifrenizle giriş yapın)');
  
  console.log('\nTest Bayi:');
  console.log('   Email: test.bayi@haldeki.com');
  console.log('   Şifre:', TEST_PASSWORD);
  console.log('   Rol: dealer (pending_invite\'dan otomatik atanacak)');
  
  console.log('\nTest Tedarikçi:');
  console.log('   Email: test.tedarikci@haldeki.com');
  console.log('   Şifre:', TEST_PASSWORD);
  console.log('   Rol: supplier (pending_invite\'dan otomatik atanacak)');
  
  console.log('\n' + '='.repeat(50));
  console.log('Kurulum tamamlandı!');
  console.log('='.repeat(50));
}

setupUsers().catch(console.error);
