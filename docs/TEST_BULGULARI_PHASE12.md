# Phase 12 Test Bulguları ve Sorun Raporu

> **Test Tarihi**: 2026-01-06
> **Test Sürümü**: Phase 12 - Multi-Supplier Product Management
> **Test Tipi**: Manuel Kullanıcı Testi
> **Toplam Sorun**: 13
> **Durum**: 🔴 Kritik sorunlar var - Acil düzeltme gerekiyor

---

## 📋 Executive Summary

Phase 12 deployment sonrası yapılan manuel testlerde **13 adet sorun** tespit edilmiştir. Bu sorunların çoğu **Tedarikçi (Supplier) paneli** ve **veritabanı RLS politikaları** ile ilgilidir.

### Önceliklendirme Özeti

| Öncelik | Sayı | Dağılım |
|---------|------|---------|
| 🔴 **Critical** | 5 | RLS hatası, sepet sistemi, veri görünürlük |
| 🟠 **High** | 4 | UI/UX, otomasyon, veri tutarlılık |
| 🟡 **Medium** | 3 | Navigation, iyileştirme talepleri |
| 🟢 **Low** | 1 | UI polish |

### Etkilenen Kullanıcı Akışları

- ❌ **Tedarikçi Ürün Yönetimi**: Tamamen kullanılamaz
- ❌ **Sipariş Verme (Sepet)**: Çalışmıyor
- ⚠️ **SuperAdmin Tedarikçi Atama**: Manuel çalışıyor, otomasyon yok
- ⚠️ **Depo Personeli Yönetimi**: Kısmen çalışıyor
- ✅ **Müşteri Ürün Görüntüleme**: Çalışıyor

---

## 🔴 Kritik Sorunlar (Critical)

### 1. Tedarikçi - Ürün Ekleme RLS Hatası

| Alan | Detay |
|------|-------|
| **Başlık** | Tedarikçi ürün ekleyemiyor - RLS policy violation |
| **Kategori** | 🔧 Backend / Database / Security |
| **Severity** | 🔴 CRITICAL - Tedarikçi paneli kullanılamaz |
| **Konum** | `src/pages/supplier/ProductForm.tsx` → `supplier_products` INSERT |

#### Hata Mesajı

```
new row violates row-level security policy for table 'products'
```

#### Açıklama

Tedarıkçi hesabı ile yeni ürün eklemeye çalışıldığında, RLS (Row-Level Security) politikası hatası alınıyor. Tedarikçinin `products` tablosuna INSERT izni yok veya RLS policy yanlış yapılandırılmış.

#### Beklenen Davranış

- Tedarikçi kendi ürünlerini ekleyebilmeli
- RLS sadece `supplier_products` tablosunda kontrol yapmalı
- `products` tablosuna INSERT için admin izni gerekiyor olabilir (design decision)

#### Kök Neden Hipotezi

1. **Phase 12 migration sonrası RLS policy eksik**: `supplier_products` tablosuna INSERT policy eklenmemiş olabilir
2. **Tedarikçi onayı kontrolü eksik**: `suppliers.approved = true` kontrolü yapılmıyor olabilir
3. **Frontend yanlış tabloya insert ediyor**: Doğrudan `products` tablosuna insert ediliyor olabilir

#### Önerilen Çözüm

```sql
-- Check RLS policy on supplier_products
SELECT * FROM pg_policies
WHERE tablename = 'supplier_products';

-- Policy should allow:
-- INSERT: supplier_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid() AND approved = true)
```

#### Test Adımları

1. Tedarıkçi hesabı ile login ol
2. "Yeni Ürün Ekle" butonuna tıkla
3. Formu doldur ve kaydet
4. **Beklenen**: Ürün başarıyla eklenmeli
5. **Gerçek**: RLS hatası

---

### 2. Tedarikçi - Excel Import Column Hatası

| Alan | Detay |
|------|-------|
| **Başlık** | Excel import column mapping çalışmıyor |
| **Kategori** | 🔧 Backend / Data Processing |
| **Severity** | 🔴 CRITICAL - Toplu ürün ekleme çalışmıyor |
| **Konum** | `src/lib/excelParser.ts` → Column validation |

#### Hata Mesajı

```
Gerekli sütunlar bulunamadı: Ürün Adı, Kategori, Birim, Taban Fiyat, Satış Fiyatı
```

#### Açıklama

Tedarıkçi Excel/CSV dosyası yüklediğinde, sistem gerekli sütunları bulamıyor. Column mapping logic çalışmıyor veya Türkçe kolon isimlerini tanımıyor.

#### Beklenen Davranış

- Excel şablonu indirilebilmeli
- Column mapping otomatik veya manuel yapılabilmeli
- Türkçe kolon isimleri desteklenmeli
- Import başarılı olmalı

#### Kök Neden Hipotezi

1. **Column name case sensitivity**: "Ürün Adı" vs "ürün adı"
2. **Missing mapping dictionary**: Türkçe → English kolon映射 yok
3. **Empty file handling**: File upload ama parse edilemiyor

#### Önerilen Çözüm

```typescript
// src/lib/excelParser.ts
const COLUMN_MAPPING = {
  'Ürün Adı': 'name',
  'Ürün adı': 'name',
  'urun_adi': 'name',
  'Kategori': 'category',
  'Birim': 'unit',
  'Taban Fiyat': 'base_price',
  'Satış Fiyatı': 'price',
  // ... more mappings
};

function normalizeColumnName(column: string): string {
  return COLUMN_MAPPING[column] || column;
}
```

#### Test Dosyası

| Ürün Adı | Kategori | Birim | Taban Fiyat | Satış Fiyatı |
|----------|----------|-------|-------------|--------------|
| Domates | SEBZELER | KG | 15.00 | 20.00 |
| Salatalık | SEBZELER | KG | 10.00 | 14.00 |

---

### 3. Sepete Ekle Çalışmıyor

| Alan | Detay |
|------|-------|
| **Başlık** | Müşteri sepete ürün ekleyemiyor |
| **Kategori** | 🔧 Backend / Business Logic |
| **Severity** | 🔴 CRITICAL - Ana iş akışı bozuk |
| **Konum** | Sepet sistemi → `CartContext` → API |

#### Hata Mesajı

*Belirtilmedi (sessiz başarısızlık)*

#### Açıklama

Müşteri veya herhangi bir rolde "Sepete Ekle" butonuna basıldığında ürün sepete eklenmiyor. Sipariş verme workflow'unda sorun var.

#### Beklenen Davranış

- "Sepete Ekle" butonu çalışmalı
- Sepet sayfasında ürün görünmeli
- Checkout yapılabilmeli
- Sipariş oluşturulabilmeli

#### Kök Neden Hipotezi

1. **Phase 12 sonrası price lookup değişti**: `products.price` yerine `supplier_products.price` kullanılması gerekiyor olabilir
2. **Cart product schema mismatch**: Sepet ürün schema'sı güncellenmedi
3. **API endpoint değişti**: `/api/cart` endpoint güncellenmedi
4. **Region products vs supplier products**: Fiyat kaynağı belirsiz

#### Etkilenen Kod

```typescript
// src/contexts/CartContext.tsx
// src/hooks/useCart.ts
// src/components/product/ProductCard.tsx (addToCart button)
```

#### Test Senaryosu

```
1. Müşteri olarak login ol (veya guest)
2. Ana sayfadan bir ürün seç
3. "Sepete Ekle" butonuna tıkla
4. Sepet ikonuna tıkla
5. Beklenen: Ürün sepette görünmeli
6. Gerçek: Sepet boş
```

---

### 4. Tedarikçi Ürün Görünürlük Sorunu (Genel)

| Alan | Detay |
|------|-------|
| **Başlık** | Tedarikçi panelinde hiçbir ürün görünmüyor |
| **Kategori** | 🔧 Backend / Data Query |
| **Severity** | 🔴 CRITICAL - Panel tamamen boş |
| **Konum** | `src/pages/supplier/ProductManagement.tsx` → Query |

#### Açıklama

Tedarıkçi hesabı ile login olunduğunda, ürün yönetim sayfası boş görünüyor. Hiçbir ürün listelenmiyor.

#### Beklenen Davranış

- Tedarikçinin eklediği ürünler görünmeli
- Veya SuperAdmin tarafından atanan ürünler görünmeli
- "Yeni Ürün Ekle" butonu aktif olmalı

#### Kök Neden Hipotezi

1. **supplier_products tablosu boş**: Data migration çalışmamış olabilir
2. **Query filter çok katı**: `WHERE supplier_id = ? AND is_active = true` filtresi hiç sonuç döndürmüyor olabilir
3. **RLS policy blokluyor**: Tedarikçi kendi ürünlerini göremiyor olabilir
4. **Frontend query hatası**: Hook yanlış endpoint'e query atıyor olabilir

#### Kullanıcı Önerisi

> "Sitede belirli ürünleri biz ekleyelim, tedarikçiler bu ürünlere fiyat girsin. SuperAdmin onaylama veya otomatik onay sistemi olmalı."

Bu öneri **workflow değişikliğini** işaret ediyor:
- **Mevcut**: Tedarikçi ürünü sıfırdan oluşturur
- **Önerilen**: SuperAdmin ürün kataloğunu oluşturur, tedarikçi sadece fiyat girer

#### Önerilen Çözüm

```sql
-- Check if supplier has any products
SELECT
  s.name AS supplier_name,
  COUNT(sp.id) AS product_count
FROM suppliers s
LEFT JOIN supplier_products sp ON s.id = sp.supplier_id
WHERE s.user_id = 'CURRENT_USER_ID'
GROUP BY s.name;

-- Check RLS policy
SELECT * FROM pg_policies
WHERE tablename = 'supplier_products'
  AND cmd = 'SELECT';
```

---

### 5. Tedarikçi Panel - "offered_price" Column Hatası

| Alan | Detay |
|------|-------|
| **Başlık** | Schema cache column hatası |
| **Kategori** | 🔧 Backend / Database Schema |
| **Severity** | 🔴 CRITICAL - Query hatası |
| **Konum** | Yeni Teklif Oluştur → `supplier_offers` tablosu |

#### Hata Mesajı

```
Could not find the 'offered_price' column of 'supplier_offers' in the schema cache
```

#### Açıklama

Tedarıkçi panelinde "Yeni Teklif Oluştur" ekranında, sistem `offered_price` kolonu arıyor ama bulamıyor. Bu kolon ya yok ya da yanlış tabloda aranıyor.

#### Ek İstek

> "Ürün seçince sitedeki o ürünün fiyatları görünsün (altında çıkabilir)"

#### Kök Neden Hipotezi

1. **Wrong table**: Query `supplier_offers` tablosuna atıyor ama aslında `supplier_products` olmalı
2. **Column renamed**: Migration'da `offered_price` → `price` olarak değiştirildi ama frontend güncellenmedi
3. **Legacy code**: Eski `supplier_offers` tablosu kaldırıldı ama kodda referans var

#### Önerilen Çözüm

```typescript
// src/pages/supplier/OfferForm.tsx (örnek)

// ❌ WRONG (legacy)
const { data } = useSupabaseQuery(
  'supplier_offers',
  ['offered_price', 'product_id']
);

// ✅ CORRECT (Phase 12)
const { data } = useSupplierProducts(supplierId);
// Returns: { price, product_id, availability, ... }
```

---

## 🟠 Yüksek Öncelik Sorunlar (High)

### 6. SuperAdmin - Bugün Halde Otomasyon Eksik

| Alan | Detay |
|------|-------|
| **Başlık** | Tedarikçi atama manuel, otomatik olmalı |
| **Kategori** | ⚙️ Backend / Business Logic |
| **Severity** | 🟠 HIGH - UX sorunu, operasyonel yük |
| **Konum** | `/admin/bugun-halde` |

#### Mevcut Durum

- ✅ SuperAdmin tedarikçi atayınca çalışıyor (harika)
- ❌ "Bugün Halde" başlangıçta boş görünüyor
- ❌ Tedarikçilerin girdiği ürünler otomatik burada gözükmüyor

#### Beklenen Davranış

> "Sistem mantığına göre otomatik atama olmalı. Tedarikçilerin girdiği ürünler otomatik burada gözükmeli."

#### Önerilen Workflow

```
1. Tedarikçi ürün ekler → supplier_products tablosuna insert
2. Trigger veya function çalışır
3. Eğer product bugun_halde_comparison'da yoksa → otomatik eklenir
4. Admin panelde görünür
```

#### Teknik Çözüm

```sql
-- Function: Auto-add to "Bugün Halde" when supplier adds product
CREATE OR REPLACE FUNCTION auto_add_to_bugun_halde()
RETURNS TRIGGER AS $$
BEGIN
  -- Product automatically appears in bugun_halde_comparison view
  -- No manual assignment needed
  -- View already joins supplier_products
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_supplier_products_insert
AFTER INSERT ON supplier_products
FOR EACH ROW
EXECUTE FUNCTION auto_add_to_bugun_halde();
```

**Not**: `bugun_halde_comparison` zaten view olduğu için, otomatik çalışması gerekiyor. Sorun **view query'si** veya **frontend filter** olabilir.

---

### 7. Depo Personeli Sayfası - Çoklu Hata

| Alan | Detay |
|------|-------|
| **Başlık** | Personel listesi + ekleme + seçim hepsi bozuk |
| **Kategori** | 🔧 Backend + Frontend |
| **Severity** | 🟠 HIGH - Sayfa kullanılamaz |
| **Konum** | `/admin/depo-personeli` |

#### Hata 1: Relationship Error

```
Could not find a relationship between 'warehouse_staff' and 'profiles'
```

**Kök Neden**: `warehouse_staff` tablosunda `user_id` FK'si `profiles.id`'ye değil, başka bir tabloya bağlı olabilir.

#### Hata 2: Tedarikçi Seçimi Çalışmıyor

Yeni personel eklerken tedarikçiler listeden seçilmiyor.

**Kök Neden**: `vendors` tablosu query'si boş dönüyor veya dropdown component'i yanlış bağlı.

#### Kullanıcı İsteği

> "Kullanıcı seçerken: isim, soyisim, mail yazılmalı"

#### Mevcut UI Sorunu

User selection UI çok basit. Sadece user ID seçiliyor, detaylar görünmüyor.

#### Önerilen Çözüm

```typescript
// src/components/admin/WarehouseStaffForm.tsx

interface StaffSelection {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  vendorId?: string; // Assigned vendor
}

// Component should show:
<Select label="Kullanıcı" options={usersWithDetails}
  renderOption={(user) => `${user.firstName} ${user.lastName} (${user.email})`}
/>
```

#### Migration Check

```sql
-- Check warehouse_staff table structure
\d warehouse_staff

-- Expected: user_id UUID REFERENCES auth.users(id) OR profiles(id)
-- Check FK relationship
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'warehouse_staff';
```

---

### 8. Tedarikçi Ürün Görünürlük (Atama Sonrası)

| Alan | Detay |
|------|-------|
| **Başlık** | SuperAdmin atamasından sonra tedarikçi görmüyor |
| **Kategori** | 🔧 Backend / Data Sync |
| **Severity** | 🟠 HIGH - Veri tutarlılık sorunu |
| **Konum** | Admin → Supplier Assignment → Supplier Panel |

#### Açıklama

1. SuperAdmin ürüne tedarikçi atadı (admin panelde görünüyor)
2. Tedarikçi hesabına giriş yapıldı
3. **Sonuç**: Ürünler tedarikçi panelinde görünmüyor

#### Beklenen Davranış

- SuperAdmin atama yapar → `supplier_products` tablosuna insert
- Tedarıkçi login olur → Atanan ürünleri görür
- Anlık sync olmalı

#### Kök Neden Hipotezi

1. **INSERT başarısız**: Admin dialog'u `supplier_products` insert etmiyor olabilir
2. **RLS policy**: Tedarıkçi `SELECT` yapamıyor olabilir
3. **Query filter**: Frontend query'si yanlış filter kullanıyor
4. **Cache issue**: React Query cache stale

#### Debug Steps

```typescript
// 1. Check database directly
SELECT * FROM supplier_products
WHERE supplier_id = 'ASSIGNED_SUPPLIER_ID'
  AND product_id = 'ASSIGNED_PRODUCT_ID';

// 2. Check RLS
SET ROLE authenticated; -- Simulate supplier user
SELECT * FROM supplier_products; -- Should return 0 if RLS blocks

// 3. Check frontend query
// src/hooks/useSupplierProducts.ts
export function useSupplierProducts(supplierId: string) {
  return useQuery({
    queryKey: ['supplier-products', supplierId],
    queryFn: () => supabase
      .from('supplier_products')
      .select('*, products(*)')
      .eq('supplier_id', supplierId)
  });
}
```

---

### 9. SuperAdmin - Ürün Düzenleme Varyasyon UI

| Alan | Detay |
|------|-------|
| **Başlık** | Varyasyon ekleme UI "çok kötü" |
| **Kategori** | 🎨 Frontend / UX |
| **Severity** | 🟠 HIGH - Kullanıcı deneyimi kötü |
| **Konum** | `/admin/urunler` → Ürün Düzenle → Varyasyonlar |

#### Kullanıcı Geri Bildirimi

> "Varyasyon ekleme yeri çok kötü, UI iyileştirmesi gerekli"

#### Mevcut UI Sorunu

- Varyasyon ekleme karmaşık
- Multi-select zor
- Type/value ayrımı belirsiz
- Görsel hierarchy yok

#### Önerilen UI Improvements

```typescript
// src/components/admin/VariationManager.tsx

// BEFORE: Complex form
<Form>
  <Input label="Varyasyon Tipi" />
  <Input label="Varyasyon Değeri" />
  <Button>Add</Button>
</Form>

// AFTER: Grouped chips + Quick select
<VariationManager>
  <VariationGroup type="size">
    <QuickSelect options={['4 LT', '1.5 KG', '500 ML']} />
    <CustomInput />
  </VariationGroup>

  <VariationGroup type="type">
    <ChipGroup options={['BEYAZ', 'RENKLI', 'SIVI', 'TOZ']} />
  </VariationGroup>

  <VariationGroup type="scent">
    <MultiSelect options={['LAVANTA', 'LİMON', 'MİSKET', ...]} />
  </VariationGroup>
</VariationManager>
```

#### Mockup Önerisi

```
┌─────────────────────────────────────────────────────────────┐
│  Ürün Varyasyonları                                    [+]   │
│  ─────────────────────────────────────────────────────────  │
│                                                               │
│  📦 Boyut (Size)                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ [4 LT] [1.5 KG] [500 ML] [+ Özel Ekle]                │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  🎨 Tip (Type)                                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ [BEYAZ] [RENKLI] [SIVI] [TOZ]                           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  🌸 Koku (Scent) - Çoklu seçim                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ [LAVANTA] [LİMON] [MİSKET] [BAHAR] [+ Seç]            │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🟡 Orta Öncelik Sorunlar (Medium)

### 10. Navigation/Breadcrumbs Eksik

| Alan | Detay |
|------|-------|
| **Başlık** | Tedarıkçi panelinde geri dönüş yok |
| **Kategori** | 🎨 Frontend / UX / Navigation |
| **Severity** | 🟡 MEDIUM - Kullanıcı kolaylığı |
| **Konum** | Tedarıkçi panel → Ürün yönetimi → Ürün detay |

#### Sorun

Tedarikçi panelinde ürünleri açınca geri dönüş yok. Kullanıcı ana sayfaya nasıl döneceğini bilmiyor.

#### Kullanıcı İsteği

> "Breadcrumbs tarzı navigation eklenmeli. Her zaman panelde kolay navigasyon olmalı."

#### Önerilen Çözüm

```typescript
// src/components/layout/SupplierBreadcrumbs.tsx

interface BreadcrumbItem {
  label: string;
  path: string;
}

function SupplierBreadcrumbs() {
  const location = useLocation();

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Panel', path: '/supplier' },
    { label: 'Ürünlerim', path: '/supplier/products' },
    // Dynamic based on route
  ];

  return (
    <nav className="flex items-center space-x-2 text-sm">
      {breadcrumbs.map((crumb, index) => (
        <>
          <Link to={crumb.path}>{crumb.label}</Link>
          {index < breadcrumbs.length - 1 && <ChevronRight size={16} />}
        </>
      ))}
    </nav>
  );
}
```

#### Breadcrumb Hierarchy

```
Tedarikçi Panel
├── Dashboard
├── Ürünlerim
│   ├── Ürün Listesi
│   └── [Ürün Adı] (detay)
├── Tekliflerim
│   ├── Bekleyen Teklifler
│   └── Teklif Geçmişi
└── Ayarlar
```

---

### 11. Tedarikçi Panel - Toplam Ürün Sipariş İstatistiği

| Alan | Detay |
|------|-------|
| **Başlık** | Vardiya bazlı toplam sipariş widget'ı eksik |
| **Kategori** | 🎨 Frontend / Analytics |
| **Severity** | 🟡 MEDIUM - Yeni özellik talebi |
| **Konum** | `/supplier` dashboard |

#### Kullanıcı İsteği

> "Vardiya aralıklarında gelen siparişin toplamını gösteren widget olsun. Örnek: Toplam kaç kilo domates, patates sipariş gelmiş."

#### Önerilen UI

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Bugün Özet                                 [Vardiya: Gün] │
│  ─────────────────────────────────────────────────────────  │
│                                                               │
│  🕒 09:00 - 12:00 (Sabah Vardiyası)                          │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Domates      125 KG  📈 +15%                            │ │
│  │ Patates       85 KG  📉 -5%                             │ │
│  │ Salatalık     62 KG  ➡️ 0%                             │ │
│  │ Toplam:      272 KG  sipariş                            │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  🕐 14:00 - 18:00 (Öğlen Vardiyası)                          │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Domates       89 KG                                      │ │
│  │ ...                                                   │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Teknik Gereksinim

```typescript
// New RPC function needed
CREATE FUNCTION get_supplier_daily_stats(
  p_supplier_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  time_window TEXT, -- '09:00-12:00'
  product_name TEXT,
  total_quantity NUMERIC,
  order_count BIGINT
);
```

#### Not

> "Çok sıkışık grid eklemeyin, modern ve pratik olsun"

UI'da **beyaz alan (whitespace)** bırakılmalı. Minimalist tasarım.

---

### 12. Tedarikçi Ürün Erişimi Sorunu

| Alan | Detay |
|------|-------|
| **Başlık** | Tedarikçilerde aynı ürünlerin hepsi olmalı |
| **Kategori** | ⚙️ Business Logic / Workflow |
| **Severity** | 🟡 MEDIUM - Workflow sorunu |
| **Konum** | Admin → Tedarikçi → Ürün atama |

#### Kullanıcı Önerisi

> "SuperAdmin mevcut ürünleri export edip tedarikçilere import edebilir"

#### Mevcut Workflow

1. SuperAdmin ürün oluşturur (`products` tablosu)
2. Her tedarikçi için tek tek atama yapılır (`supplier_products`)
3. **Sorun**: Manuel ve zaman alıcı

#### Önerilen Workflow

**Option 1: Bulk Assignment**
```typescript
// Admin panel: "Ürünü tüm tedarikçilere ata" butonu
function assignProductToAllSuppliers(productId: string) {
  // Get all approved suppliers
  const suppliers = await getApprovedSuppliers();

  // Create supplier_products for each
  suppliers.forEach(supplier => {
    await createSupplierProduct({
      supplier_id: supplier.id,
      product_id: productId,
      price: 0, // Tedarikçi kendi fiyatını girsin
      is_active: false, // Tedarikçi onaylayana kadar pasif
    });
  });
}
```

**Option 2: Export/Import**
```typescript
// Export template: Product list with all suppliers
const exportTemplate = await generateSupplierProductTemplate();

// CSV columns:
// product_id, product_name, supplier_1_price, supplier_2_price, ...
```

#### Önerilen UI

```
┌─────────────────────────────────────────────────────────────┐
│  Ürün: Domates (1 KG)                                  ✕   │
│  ─────────────────────────────────────────────────────────  │
│  Tedarikçi Atama                                            │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ [x] Aliaga Tedarik        Fiyat: [15.00] TL            │ │
│  │ [x] Menemen Toptancılık    Fiyat: [14.50] TL            │ │
│  │ [ ] İzmir Hal            Fiyat: [  ----  ] TL           │ │
│  │ [x] Tümünü Seç                                          │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  [Seçilenlere Ata]  [Tedarikçi Import CSV]                   │
└─────────────────────────────────────────────────────────────┘
```

---

### 13. Tedarikçi Ürün Görünürlük (Genel - Excel Import İlişkili)

| Alan | Detay |
|------|-------|
| **Başlık** | Tedarikçi ürünleri tam görmüyor (Excel import edilmemiş) |
| **Kategori** | ⚙️ Business Logic / Data |
| **Severity** | 🟡 MEDIUM - Veri bütünlüğü |
| **Konum** | Tedarikçi panel → Ürün listesi |

#### Açıklama

Tedarikçilerde aynı ürünlerin hepsi olmalı. Mevcut durumda bazı tedarikçilerde ürünler eksik.

#### Kök Neden

> "Tedarikçi ürünleri tam görmüyor. Sebebi: Excel import edilmemiş veya girilmemiş olabilir."

#### İş Sorunu

- Tedarikçi A: Domates, Patates, Biber (Excel import etti)
- Tedarikçi B: Domates (manuel ekledi)
- Tedarikçi C: Hiç ürün yok (yeni hesap)

#### Beklenen Durum

Tüm tedarikçiler **aynı ürün kataloğuna** erişebilmeli. Fiyatları farklı olabilir ama ürün listesi aynı olmalı.

#### Önerilen Çözüm

**Option 1: Merkezi Ürün Kataloğu**
```sql
-- SuperAdmin creates master product catalog
-- Suppliers add their prices to existing products
-- NOT: Suppliers create products from scratch
```

**Option 2: Auto-Assignment on Signup**
```typescript
// When new supplier is approved
async function onSupplierApproved(supplierId: string) {
  // Get all active products
  const products = await getActiveProducts();

  // Assign all products to new supplier
  products.forEach(product => {
    await createSupplierProduct({
      supplier_id: supplierId,
      product_id: product.id,
      price: null, // Supplier fills in later
      is_active: false, // Inactive until price set
    });
  });
}
```

#### Workflow Change

| Eski Workflow | Yeni Workflow |
|--------------|--------------|
| Tedarikçi ürünü sıfırdan oluşturur | SuperAdmin ürün kataloğunu oluşturur |
| Her tedarikçi farklı ürünlere sahip | Tüm tedarikçiler aynı ürünlere sahip |
| Fiyat + Ürün bilgisi girilir | Sadece fiyat girilir |
| Tutarsızlık yüksek | Tutarsızlık düşük |

---

## 🎯 Priority Matrix

### Acil Düzeltme (Bugün)

| # | Sorun | Kategori | Tahmini Süre |
|---|-------|----------|-------------|
| 1 | RLS Hatası (Tedarikçi Ürün Ekleme) | Database | 1 saat |
| 3 | Sepete Ekle Çalışmıyor | Backend | 2 saat |
| 4 | Tedarikçi Ürün Görünürlük | Backend + Frontend | 2 saat |
| 5 | offered_price Column Hatası | Database | 30 dk |

### Bu Hafta

| # | Sorun | Kategori | Tahmini Süre |
|---|-------|----------|-------------|
| 2 | Excel Import Column Hatası | Backend | 2 saat |
| 7 | Depo Personeli Sayfası | Full Stack | 3 saat |
| 8 | Atama Sonrası Görünürlük | Backend | 1 saat |
| 9 | Varyasyon UI | Frontend | 4 saat |

### Gelecek Sprint

| # | Sorun | Kategori | Tahmini Süre |
|---|-------|----------|-------------|
| 6 | Bugün Halde Otomasyon | Backend | 3 saat |
| 10 | Breadcrumbs | Frontend | 2 saat |
| 11 | Sipariş İstatistiği Widget | Full Stack | 4 saat |
| 12 | Tedarikçi Ürün Erişimi | Business Logic | 2 saat |
| 13 | Genel Ürün Görünürlük | Business Logic | 3 saat |

---

## 📊 Impact Analysis

### Kullanıcı Rolleri Etki Matrisi

| Rol | Etkilenen Özellikler | Etki Seviyesi |
|-----|---------------------|--------------|
| **Müşteri** | Sepete ekle, sipariş verme | 🔴 Kritik - Ana akış bozuk |
| **Tedarikçi** | Ürün ekleme, Excel import, ürün listesi | 🔴 Kritik - Panel tamamen bozuk |
| **SuperAdmin** | Tedarikçi atama, depo personeli | 🟠 Yüksek - Kısmen çalışıyor |
| **Depo Personeli** | Personel yönetimi | 🟠 Yüksek - Sayfa hatalı |
| **Bayi** | - | ✅ Etkilenmedi |

### İş Akışı Etkileri

```
❌ KESİNLİKLE BOZUK (Kullanılamaz):
   - Tedarikçi ürün ekleme
   - Excel/CSV import
   - Sepete ekle
   - Sipariş verme

⚠️ KISMIEN ÇALIŞIYOR (Workaround var):
   - SuperAdmin tedarikçi atama (manuel çalışıyor)
   - Depo personeli sayfası (hatalar ama bazı özellikler çalışıyor)
   - Bugün Halde (boş başlıyor ama admin atayınca doluyor)

✅ TAMAMEN ÇALIŞIYOR:
   - Ürün listesi görüntüleme
   - Bölge seçimi
   - Login/register
```

---

## 🔧 Proposed Solutions (Teknik Detaylar)

### Solution 1: RLS Policy Fix (Critical)

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Suppliers can insert their own products" ON supplier_products;

-- Recreate with correct logic
CREATE POLICY "Suppliers can insert their own products"
ON supplier_products
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM suppliers
    WHERE suppliers.id = supplier_products.supplier_id
      AND suppliers.user_id = auth.uid()
      AND suppliers.approved = true
  )
);
```

### Solution 2: Excel Column Mapping

```typescript
// src/lib/excelParser.ts

const TURKISH_COLUMN_MAPPING: Record<string, string> = {
  // Product info
  'Ürün Adı': 'name',
  'Ürün adı': 'name',
  'urun_adi': 'name',
  'Ad': 'name',

  // Category
  'Kategori': 'category',
  'kategori': 'category',

  // Unit
  'Birim': 'unit',
  'birim': 'unit',

  // Price
  'Taban Fiyat': 'base_price',
  'taban_fiyat': 'base_price',
  'Alış Fiyatı': 'base_price',

  'Satış Fiyatı': 'price',
  'satis_fiyati': 'price',
  'Fiyat': 'price',
};

function normalizeHeaders(headers: string[]): string[] {
  return headers.map(h => TURKISH_COLUMN_MAPPING[h] || h);
}
```

### Solution 3: Cart Context Fix

```typescript
// src/contexts/CartContext.tsx

// Phase 12: Price comes from supplier_products, not products
async function addToCart(productId: string, quantity: number) {
  // OLD: price from products.price
  // const { data: product } = await supabase.from('products').select('price').eq('id', productId).single();

  // NEW: price from supplier_products
  const { data: supplierProduct } = await supabase
    .from('supplier_products')
    .select('price, supplier_id')
    .eq('product_id', productId)
    .eq('is_active', true)
    .order('price', { ascending: true }) // Get lowest price
    .limit(1)
    .single();

  if (!supplierProduct) {
    throw new Error('Ürün şu anda stoğumuzda yok');
  }

  const cartItem = {
    product_id: productId,
    supplier_id: supplierProduct.supplier_id,
    price: supplierProduct.price,
    quantity,
  };

  setCartItems(prev => [...prev, cartItem]);
}
```

### Solution 7: Warehouse Staff Relationship

```sql
-- Check current FK
ALTER TABLE warehouse_staff
DROP CONSTRAINT IF EXISTS warehouse_staff_user_id_fkey;

-- Add correct FK to profiles
ALTER TABLE warehouse_staff
ADD CONSTRAINT warehouse_staff_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
```

---

## 📝 Next Steps

### 1. Acil Eylem Planı (Bugün)

```bash
# 1. RLS politikalarını kontrol et
npx supabase db remote commit --schema public

# 2. supplier_products RLS fix
# Edit migration file manually
npx supabase db push

# 3. Frontend query'leri güncelle
# - CartContext.tsx
# - ProductForm.tsx
# - OfferForm.tsx

# 4. Test et
npm run test
```

### 2. Kod İnceleme Checklist

- [ ] `src/pages/supplier/ProductForm.tsx` - INSERT query'si kontrol
- [ ] `src/lib/excelParser.ts` - Column mapping ekle
- [ ] `src/contexts/CartContext.tsx` - Price lookup güncelle
- [ ] `src/pages/supplier/ProductManagement.tsx` - Query filter kontrol
- [ ] `src/pages/admin/WarehouseStaff.tsx` - Relationship düzelt
- [ ] `src/components/admin/VariationManager.tsx` - UI iyileştir

### 3. Test Planı

```typescript
// Test cases to add
describe('Supplier Product Management', () => {
  it('should allow supplier to add product', async () => {
    // Login as supplier
    // Navigate to product form
    // Fill form
    // Submit
    // Assert: Product in supplier_products
  });

  it('should show assigned products in supplier panel', async () => {
    // Admin assigns product to supplier
    // Login as supplier
    // Assert: Product visible in list
  });

  it('should import Excel with Turkish columns', async () => {
    // Upload Excel with Turkish headers
    // Assert: All rows imported
  });
});
```

### 4. Deployment Checklist

Phase 12.1 Hotfix Release:

- [ ] RLS policies fixed
- [ ] Excel column mapping added
- [ ] Cart context updated
- [ ] Warehouse staff relationship fixed
- [ ] All tests passing
- [ ] Manual testing completed
- [ ] Documentation updated

---

## 📚 Appendix

### A. İlgili Dosyalar

| Dosya | Sorun | Değişiklik |
|-------|-------|-----------|
| `supabase/migrations/20250110000000_phase12_multi_supplier_products.sql` | RLS policies | Policy rewrite |
| `src/pages/supplier/ProductForm.tsx` | Insert hatası | Query fix |
| `src/lib/excelParser.ts` | Column mapping | Mapping dict |
| `src/contexts/CartContext.tsx` | Price lookup | supplier_products join |
| `src/components/admin/WarehouseStaffForm.tsx` | User selection | UI fix |
| `src/pages/admin/WarehouseStaff.tsx` | Relationship error | FK fix |

### B. Referanslar

- [Phase 12 Documentation](./phases/phase-12-multi-supplier.md)
- [Database Schema](./DATABASE_SCHEMA_PHASE12.md)
- [PRD](./prd.md)
- [Current Status](./CURRENT_STATUS.md)

### C. Terminoloji

| Terim | Açıklama |
|-------|----------|
| **RLS (Row-Level Security)** | PostgreSQL satır seviyesi güvenlik politikası |
| **Junction Table** | Çok-çok ilişki için ara tablo (supplier_products) |
| **Supplier Product** | Tedarikçinin ürün katalog girdisi (fiyat, stok) |
| **Product Variation** | Ürün varyasyonu (boyut, tip, koku) |
| **Bugün Halde** | Günlük fiyat karşılaştırma sayfası |

---

## 📞 İletişim

**Sorun Soruları İçin**:
- Database: `database-architect` agent
- Frontend: `frontend-specialist` agent
- Backend: `backend-specialist` agent

**Dokümantasyon Güncellemesi**:
- `documentation-writer` agent

---

**Rapor Versiyonu**: 1.0
**Oluşturulma**: 2026-01-06
**Durum**: ⏳ Bekleyen Düzeltmeler
