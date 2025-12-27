/**
 * Admin şifresini sıfırla
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Hata: Supabase bilgileri bulunamadı');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function resetPassword() {
  const email = 'bayraktarismail00@gmail.com';
  const newPassword = 'Test1234!';
  
  console.log(`\n🔐 ${email} şifresi güncelleniyor...`);
  
  // Önce kullanıcıyı bul
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('❌ Kullanıcı listesi alınamadı:', listError.message);
    return;
  }
  
  const user = users.users.find(u => u.email === email);
  
  if (!user) {
    console.log('⚠️ Kullanıcı bulunamadı, oluşturuluyor...');
    
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: newPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Admin User' }
    });
    
    if (createError) {
      console.error('❌ Kullanıcı oluşturulamadı:', createError.message);
      return;
    }
    
    console.log('✅ Kullanıcı oluşturuldu:', newUser.user.id);
    
    // Superadmin rolü ata
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: newUser.user.id,
        role: 'superadmin'
      });
    
    if (roleError) {
      console.error('❌ Rol atanamadı:', roleError.message);
    } else {
      console.log('✅ Superadmin rolü atandı');
    }
  } else {
    console.log('✅ Kullanıcı bulundu:', user.id);
    
    // Şifreyi güncelle
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );
    
    if (updateError) {
      console.error('❌ Şifre güncellenemedi:', updateError.message);
    } else {
      console.log('✅ Şifre güncellendi');
    }
    
    // Superadmin rolünü kontrol et
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (!roleData || roleData.role !== 'superadmin') {
      console.log('⚠️ Superadmin rolü yok, ekleniyor...');
      
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: user.id,
          role: 'superadmin'
        });
      
      if (roleError) {
        console.error('❌ Rol atanamadı:', roleError.message);
      } else {
        console.log('✅ Superadmin rolü atandı');
      }
    } else {
      console.log('✅ Superadmin rolü mevcut');
    }
  }
  
  console.log('\n📌 Giriş bilgileri:');
  console.log(`   Email: ${email}`);
  console.log(`   Şifre: ${newPassword}`);
}

resetPassword().catch(console.error);

