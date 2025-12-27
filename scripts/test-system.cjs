/**
 * Haldeki Sistem Test Script
 * 
 * Bu script:
 * 1. Veritabanı şemasını kontrol eder
 * 2. Bayi/Tedarikçi onay akışını test eder
 * 3. Eksik kolonları tespit eder
 * 4. Test verisi oluşturur
 * 
 * Kullanım: node scripts/test-system.cjs
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Hata: VITE_SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY bulunamadı');
  console.log('Lütfen .env.local dosyasında bu değişkenleri tanımlayın');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkTableColumns(tableName) {
  console.log(`\n📋 ${tableName} tablosu kontrol ediliyor...`);
  
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);
  
  if (error) {
    console.log(`  ❌ Tablo erişim hatası: ${error.message}`);
    return null;
  }
  
  if (data && data.length > 0) {
    const columns = Object.keys(data[0]);
    console.log(`  ✅ Kolonlar: ${columns.join(', ')}`);
    return columns;
  }
  
  console.log(`  ⚠️ Tablo boş, kolon listesi alınamıyor`);
  return [];
}

async function checkDealers() {
  console.log('\n' + '='.repeat(50));
  console.log('🏪 BAYI SİSTEMİ KONTROLÜ');
  console.log('='.repeat(50));
  
  const columns = await checkTableColumns('dealers');
  
  // approval_status kolonu var mı?
  if (columns && !columns.includes('approval_status')) {
    console.log('  ❌ KRITIK: approval_status kolonu eksik!');
    console.log('  → Migration çalıştırılmamış olabilir');
  }
  
  // Mevcut bayileri listele
  const { data: dealers, error } = await supabase
    .from('dealers')
    .select('id, name, approval_status, is_active, contact_email')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.log(`  ❌ Bayi listesi hatası: ${error.message}`);
    return;
  }
  
  console.log(`\n📊 Toplam Bayi: ${dealers?.length || 0}`);
  
  if (dealers && dealers.length > 0) {
    const pending = dealers.filter(d => d.approval_status === 'pending');
    const approved = dealers.filter(d => d.approval_status === 'approved');
    const rejected = dealers.filter(d => d.approval_status === 'rejected');
    
    console.log(`  - Onay Bekleyen: ${pending.length}`);
    console.log(`  - Onaylanmış: ${approved.length}`);
    console.log(`  - Reddedilmiş: ${rejected.length}`);
    
    if (pending.length > 0) {
      console.log('\n🟡 Onay Bekleyen Bayiler:');
      pending.forEach(d => console.log(`  - ${d.name} (${d.contact_email})`));
    } else {
      console.log('\n⚠️ Onay bekleyen bayi yok - Admin panelde bölüm görünmeyecek');
    }
  }
}

async function checkSuppliers() {
  console.log('\n' + '='.repeat(50));
  console.log('🚚 TEDARİKÇİ SİSTEMİ KONTROLÜ');
  console.log('='.repeat(50));
  
  const columns = await checkTableColumns('suppliers');
  
  // approval_status kolonu var mı?
  if (columns && !columns.includes('approval_status')) {
    console.log('  ❌ KRITIK: approval_status kolonu eksik!');
    console.log('  → Migration çalıştırılmamış olabilir');
  }
  
  // Mevcut tedarikçileri listele
  const { data: suppliers, error } = await supabase
    .from('suppliers')
    .select('id, name, approval_status, is_active, contact_email')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.log(`  ❌ Tedarikçi listesi hatası: ${error.message}`);
    return;
  }
  
  console.log(`\n📊 Toplam Tedarikçi: ${suppliers?.length || 0}`);
  
  if (suppliers && suppliers.length > 0) {
    const pending = suppliers.filter(s => s.approval_status === 'pending');
    const approved = suppliers.filter(s => s.approval_status === 'approved');
    const rejected = suppliers.filter(s => s.approval_status === 'rejected');
    
    console.log(`  - Onay Bekleyen: ${pending.length}`);
    console.log(`  - Onaylanmış: ${approved.length}`);
    console.log(`  - Reddedilmiş: ${rejected.length}`);
    
    if (pending.length > 0) {
      console.log('\n🟡 Onay Bekleyen Tedarikçiler:');
      pending.forEach(s => console.log(`  - ${s.name} (${s.contact_email})`));
    } else {
      console.log('\n⚠️ Onay bekleyen tedarikçi yok - Admin panelde bölüm görünmeyecek');
    }
  }
}

async function checkOrders() {
  console.log('\n' + '='.repeat(50));
  console.log('📦 SİPARİŞ SİSTEMİ KONTROLÜ');
  console.log('='.repeat(50));
  
  const columns = await checkTableColumns('orders');
  
  const requiredColumns = ['dealer_id', 'payment_status', 'delivery_notes', 'delivery_photo_url'];
  if (columns) {
    const missing = requiredColumns.filter(c => !columns.includes(c));
    if (missing.length > 0) {
      console.log(`  ⚠️ Eksik kolonlar: ${missing.join(', ')}`);
    } else {
      console.log('  ✅ Faz 6 kolonları mevcut');
    }
  }
}

async function checkProducts() {
  console.log('\n' + '='.repeat(50));
  console.log('🥬 ÜRÜN SİSTEMİ KONTROLÜ');
  console.log('='.repeat(50));
  
  const columns = await checkTableColumns('products');
  
  if (columns) {
    if (!columns.includes('variants')) {
      console.log('  ⚠️ variants kolonu eksik');
    } else {
      console.log('  ✅ variants kolonu mevcut');
    }
    
    if (!columns.includes('supplier_id')) {
      console.log('  ⚠️ supplier_id kolonu eksik');
    } else {
      console.log('  ✅ supplier_id kolonu mevcut');
    }
    
    if (!columns.includes('base_price')) {
      console.log('  ❌ base_price kolonu eksik (kritik!)');
    } else {
      console.log('  ✅ base_price kolonu mevcut');
    }
  }
  
  // Ürün sayısı
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  
  if (!error) {
    console.log(`\n📊 Aktif Ürün Sayısı: ${count}`);
  }
}

async function checkDealerCustomers() {
  console.log('\n' + '='.repeat(50));
  console.log('👥 BAYİ MÜŞTERİ SİSTEMİ KONTROLÜ');
  console.log('='.repeat(50));
  
  const { data, error } = await supabase
    .from('dealer_customers')
    .select('*')
    .limit(1);
  
  if (error) {
    if (error.code === '42P01') {
      console.log('  ❌ dealer_customers tablosu mevcut değil');
      console.log('  → Faz 6 migration çalıştırılmamış olabilir');
    } else {
      console.log(`  ❌ Hata: ${error.message}`);
    }
  } else {
    console.log('  ✅ dealer_customers tablosu mevcut');
  }
}

async function createTestData() {
  console.log('\n' + '='.repeat(50));
  console.log('🧪 TEST VERİSİ OLUŞTURMA');
  console.log('='.repeat(50));
  
  // Test için pending durumunda bayi oluştur
  const testDealerEmail = 'test.pending.bayi@haldeki.com';
  
  // Önce var mı kontrol et
  const { data: existingDealer } = await supabase
    .from('dealers')
    .select('id')
    .eq('contact_email', testDealerEmail)
    .single();
  
  if (existingDealer) {
    console.log('  ℹ️ Test bayisi zaten mevcut, güncelleniyor...');
    const { error } = await supabase
      .from('dealers')
      .update({ approval_status: 'pending' })
      .eq('id', existingDealer.id);
    
    if (error) {
      console.log(`  ❌ Güncelleme hatası: ${error.message}`);
    } else {
      console.log('  ✅ Test bayisi pending durumuna güncellendi');
    }
  } else {
    // Yeni test bayisi oluştur
    const { error: dealerError } = await supabase
      .from('dealers')
      .insert({
        name: 'Test Pending Bayi',
        contact_name: 'Test Yetkili',
        contact_phone: '0555 111 2222',
        contact_email: testDealerEmail,
        region_ids: [],
        is_active: false,
        approval_status: 'pending',
        tax_number: '1234567890'
      });
    
    if (dealerError) {
      console.log(`  ❌ Test bayisi oluşturulamadı: ${dealerError.message}`);
    } else {
      console.log('  ✅ Test bayisi oluşturuldu (pending durumunda)');
    }
  }
  
  // Test için pending durumunda tedarikçi oluştur
  const testSupplierEmail = 'test.pending.tedarikci@haldeki.com';
  
  const { data: existingSupplier } = await supabase
    .from('suppliers')
    .select('id')
    .eq('contact_email', testSupplierEmail)
    .single();
  
  if (existingSupplier) {
    console.log('  ℹ️ Test tedarikçisi zaten mevcut, güncelleniyor...');
    const { error } = await supabase
      .from('suppliers')
      .update({ approval_status: 'pending' })
      .eq('id', existingSupplier.id);
    
    if (error) {
      console.log(`  ❌ Güncelleme hatası: ${error.message}`);
    } else {
      console.log('  ✅ Test tedarikçisi pending durumuna güncellendi');
    }
  } else {
    const { error: supplierError } = await supabase
      .from('suppliers')
      .insert({
        name: 'Test Pending Tedarikçi',
        contact_name: 'Test Yetkili',
        contact_phone: '0555 333 4444',
        contact_email: testSupplierEmail,
        is_active: false,
        approval_status: 'pending',
        product_categories: ['sebze', 'meyve']
      });
    
    if (supplierError) {
      console.log(`  ❌ Test tedarikçisi oluşturulamadı: ${supplierError.message}`);
    } else {
      console.log('  ✅ Test tedarikçisi oluşturuldu (pending durumunda)');
    }
  }
}

async function runAllChecks() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║        HALDEKİ SİSTEM TEST RAPORU                ║');
  console.log('║        ' + new Date().toLocaleString('tr-TR').padEnd(24) + '       ║');
  console.log('╚══════════════════════════════════════════════════╝');
  
  await checkDealers();
  await checkSuppliers();
  await checkOrders();
  await checkProducts();
  await checkDealerCustomers();
  await createTestData();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ TEST TAMAMLANDI');
  console.log('='.repeat(50));
  console.log('\n📌 Sonraki Adımlar:');
  console.log('1. Admin paneli açın: http://localhost:8080/admin/dealers');
  console.log('2. "Onay Bekleyen Başvurular" bölümünü kontrol edin');
  console.log('3. Test bayisini onaylayın veya reddedin');
  console.log('');
}

runAllChecks().catch(console.error);

