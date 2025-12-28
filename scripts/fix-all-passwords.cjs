require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Supabase URL or Service Role Key not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
const DEFAULT_PASSWORD = 'Test1234!';

async function fixAllPasswords() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log(`║        ŞİFRE SIFIRLAMA VE KONTROL                ║`);
  console.log(`║        ${new Date().toLocaleString()}            ║`);
  console.log('╚══════════════════════════════════════════════════╝\n');

  try {
    // Tüm kullanıcıları listele
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Kullanıcılar listelenemedi:', listError.message);
      return;
    }

    console.log(`📊 Toplam Kullanıcı Sayısı: ${users.users.length}\n`);

    if (users.users.length === 0) {
      console.log('⚠️ Hiç kullanıcı bulunamadı. Yeni kullanıcılar oluşturulacak...\n');
      
      // Admin kullanıcısı oluştur
      const adminEmail = 'bayraktarismail00@gmail.com';
      const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
      });

      if (adminError) {
        console.error('❌ Admin kullanıcısı oluşturulamadı:', adminError.message);
      } else {
        console.log(`✅ Admin kullanıcısı oluşturuldu: ${adminEmail}`);
        
        // Superadmin rolü ata
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: adminUser.user.id, role: 'superadmin' });
        
        if (roleError) {
          console.error('❌ Superadmin rolü atanamadı:', roleError.message);
        } else {
          console.log('✅ Superadmin rolü atandı');
        }
      }

      // Test bayi oluştur
      const dealerEmail = 'test.bayi@haldeki.com';
      const { data: dealerUser, error: dealerError } = await supabase.auth.admin.createUser({
        email: dealerEmail,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
      });

      if (dealerError) {
        console.error('❌ Test bayi oluşturulamadı:', dealerError.message);
      } else {
        console.log(`✅ Test bayi oluşturuldu: ${dealerEmail}`);
        
        // Dealer rolü ata
        await supabase.from('user_roles').insert({ user_id: dealerUser.user.id, role: 'dealer' });
      }

      // Test tedarikçi oluştur
      const supplierEmail = 'test.tedarikci@haldeki.com';
      const { data: supplierUser, error: supplierError } = await supabase.auth.admin.createUser({
        email: supplierEmail,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
      });

      if (supplierError) {
        console.error('❌ Test tedarikçi oluşturulamadı:', supplierError.message);
      } else {
        console.log(`✅ Test tedarikçi oluşturuldu: ${supplierEmail}`);
        
        // Supplier rolü ata
        await supabase.from('user_roles').insert({ user_id: supplierUser.user.id, role: 'supplier' });
      }

      console.log('\n📌 Giriş Bilgileri:');
      console.log(`   Admin: ${adminEmail} / ${DEFAULT_PASSWORD}`);
      console.log(`   Bayi: ${dealerEmail} / ${DEFAULT_PASSWORD}`);
      console.log(`   Tedarikçi: ${supplierEmail} / ${DEFAULT_PASSWORD}\n`);
      return;
    }

    // Mevcut kullanıcıların şifrelerini sıfırla
    console.log('🔐 Kullanıcı şifreleri sıfırlanıyor...\n');

    for (const user of users.users) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { 
          password: DEFAULT_PASSWORD,
          email_confirm: true, // Email'i otomatik confirm et
          app_metadata: { email_verified: true } // Email verification metadata
        }
      );

      if (updateError) {
        console.error(`❌ ${user.email} şifresi güncellenemedi:`, updateError.message);
      } else {
        console.log(`✅ ${user.email} şifresi güncellendi`);
      }
    }

    console.log('\n📌 Tüm hesaplar için şifre:');
    console.log(`   Şifre: ${DEFAULT_PASSWORD}\n`);

    // Kullanıcı listesi
    console.log('📋 Kullanıcı Listesi:');
    for (const user of users.users) {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      const roleList = roles?.map(r => r.role).join(', ') || 'user';
      console.log(`   - ${user.email} (${roleList})`);
    }

    console.log('\n✅ İşlem tamamlandı!\n');

  } catch (error) {
    console.error('❌ Hata:', error.message);
  }
}

fixAllPasswords();

