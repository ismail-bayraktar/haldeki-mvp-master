# Supabase SQL Deployment Rehberi (Başlangıç Seviyesi)

> Yeni başlayanlar için Supabase SQL Editor kullanım kılavuzu

## Hızlı Başlangıç

```
SQL Editor Aç → SQL Kodunu Yapıştır → RUN Tuşuna Bas → Başarıyı Kontrol Et
```

---

## İçindekiler

1. [SQL Migration Nedir?](#1-sql-migration-nedir)
2. [Supabase SQL Editor Turu](#2-supabase-sql-editor-turu)
3. [SQL Çalıştırma Adımları](#3-sql-çalıştırma-adımları)
4. [Başarıyı Doğrulama](#4-başarıyı-doğrulama)
5. [Yaygın Hatalar ve Çözümleri](#5-yaygın-hatalar-ve-çözümleri)

---

## 1. SQL Migration Nedir?

### Basitçe Anlatım

**Migration** = Veritabanını güncelleme işlemi

Hayali bir örnek:

```
ESKİ DURUM: Boş veritabanı
    ↓
MIGRATION (SQL kodları çalıştırılır)
    ↓
YENİ DURUM: Tablolar, fonksiyonlar, veriler hazır
```

### Neden Gerekli?

- Boş bir veritabanına başlamazsın
- Tüm tabloları, fonksiyonları tek tek elle oluşturmak yerine hazır SQL kodlarını çalıştırırsın
- Herkes aynı veritabanı yapısına sahip olur

### Migration Türleri

| Tür | Açıklama | Örnek |
|-----|----------|-------|
| **Schema** | Tablo oluşturma | `CREATE TABLE products...` |
| **Data** | Veri ekleme | `INSERT INTO products...` |
| **Function** | Fonksiyon oluşturma | `CREATE FUNCTION get_...` |

---

## 2. Supabase SQL Editor Turu

### SQL Editor'e Nasıl Gidilir?

1. **Supabase Dashboard**'a giriş yap
2. Sol menüden **"SQL Editor"** ikonuna tıkla (SQL yazan simge)
3. **"+ New query"** butonuna tıkla

### Ekran Bölümleri

```
┌─────────────────────────────────────────────────────────────┐
│  Supabase SQL Editor                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ SQL EDITOR (Buraya kod yapıştırılır)                │   │
│  │                                                      │   │
│  │ CREATE FUNCTION my_function() ...                   │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [RUN] [Save] [Format]                                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ RESULTS (Sonuçlar burada görünür)                   │   │
│  │                                                      │   │
│  │ Success: Query completed successfully               │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Önemli Butonlar

| Buton | İşlevi | Klavye Kısayolu |
|-------|--------|-----------------|
| **RUN** | SQL kodunu çalıştır | `Ctrl + Enter` |
| **Save** | Sorguyu kaydet | `Ctrl + S` |
| **Format** | Kodu düzenle | `Shift + Alt + F` |

---

## 3. SQL Çalıştırma Adımları

### Adım 1: SQL Dosyasını Bul

Projenizdeki migration dosyaları:

```
F:\donusum\haldeki-love\haldeki-market\
└── supabase/
    └── migrations/
        ├── 20260110150000_supplier_catalog_optimization.sql
        ├── 20260110155000_supplier_catalog_security_fix.sql
        └── ... (diğer migration dosyaları)
```

### Adım 2: SQL Kodunu Kopyala

1. Dosyayı bir metin editörü ile aç (VS Code önerilir)
2. Tüm içeriği seç: `Ctrl + A`
3. Kopyala: `Ctrl + C`

### Adım 3: SQL Editor'a Yapıştır

1. Supabase SQL Editor'ında yeni query aç
2. Boş alana tıkla
3. Yapıştır: `Ctrl + V`

### Adım 4: RUN Tuşuna Bas

- Yeşil **RUN** butonuna tıkla
- Veya `Ctrl + Enter` tuşuna bas

### Adım 5: Sonucu Kontrol Et

**Başarılı sonuç:**

```
✓ Success
Query completed successfully
```

**Hatalı sonuç:**

```
✗ Error
ERROR: syntax error at or near "..."
```

---

## 4. Başarıyı Doğrulama

### 4.1. Fonksiyon Oluşturuldu mu?

**Test Query 1: Fonksiyon Listesi**

```sql
-- Oluşturulan fonksiyonları göster
SELECT
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name LIKE '%supplier%'
ORDER BY routine_name;
```

**Beklenen Sonuç:**

| routine_name | routine_type |
|--------------|--------------|
| batch_upsert_supplier_prices | FUNCTION |
| get_supplier_product_catalog | FUNCTION |
| get_supplier_product_stats | FUNCTION |
| upsert_supplier_product_price | FUNCTION |

### 4.2. Execute Yetkisi Verildi mi?

**Test Query 2: Yetki Kontrolü**

```sql
-- Fonksiyon execute yetkilerini kontrol et
SELECT
    routine_name,
    grantee,
    privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
    AND routine_name = 'get_supplier_product_catalog';
```

**Beklenen Sonuç:**

| routine_name | grantee | privilege_type |
|--------------|---------|----------------|
| get_supplier_product_catalog | authenticated | EXECUTE |

### 4.3. Fonksiyonu Çalıştır

**Test Query 3: Fonksiyon Test**

```sql
-- Tedarikçi ürün kataloğu fonksiyonunu test et
SELECT * FROM get_supplier_product_catalog(
    NULL,              -- supplier_id (NULL = otomatik)
    1,                 -- page
    10,                -- page_size
    NULL,              -- category
    NULL,              -- search
    true               -- only_active
);
```

**Beklenen Sonuç:**

Ürün listesi dönmeli:
- `product_id`
- `product_name`
- `supplier_price`
- `total_items`
- ... vb. sütunlar

---

## 5. Yaygın Hatalar ve Çözümleri

### Hata 1: "Function already exists"

**Hata Mesajı:**

```
ERROR: function get_supplier_product_catalog already exists
```

**Neden:** Fonksiyon daha önce oluşturulmuş

**Çözüm:**

```sql
-- Önce fonksiyonu sil
DROP FUNCTION IF EXISTS get_supplier_product_catalog(UUID, INT, INT, TEXT, TEXT, BOOLEAN);

-- Sonra yeniden oluştur
CREATE FUNCTION get_supplier_product_catalog(...) ...
```

### Hata 2: "Syntax error"

**Hata Mesajı:**

```
ERROR: syntax error at or near "CREATE"
```

**Neden:** SQL kodu kopyalanırken eksik kopyalanmış

**Çözüm:**

1. Dosyanın tamamını seçtiğinden emin ol (`Ctrl + A`)
2. Parantezlerin kapandığını kontrol et
3. Tırnak işaretlerinin doğru olduğunu kontrol et

**Örnek:**

```sql
-- ❌ YANLIŞ - Parantez kapalı değil
CREATE FUNCTION test() RETURNS UUID AS $$
    BEGIN
        RETURN gen_random_uuid();
    END;
$$ LANGUAGE plpgsql;  -- $$ kapatılmış ama fonksiyon parantezi eksik

-- ✅ DOĞRU
CREATE FUNCTION test()
RETURNS UUID AS $$
    BEGIN
        RETURN gen_random_uuid();
    END;
$$ LANGUAGE plpgsql;
```

### Hata 3: "Permission denied"

**Hata Mesajı:**

```
ERROR: permission denied for function get_supplier_product_catalog
```

**Neden:** Execute yetkisi verilmemiş

**Çözüm:**

```sql
-- Yetki ver
GRANT EXECUTE ON FUNCTION get_supplier_product_catalog TO authenticated;

-- Yetkiyi kontrol et
SELECT * FROM information_schema.routine_privileges
WHERE routine_name = 'get_supplier_product_catalog';
```

### Hata 4: "Must be owner"

**Hata Mesajı:**

```
ERROR: must be owner of function get_supplier_product_catalog
```

**Neden:** Başka bir kullanıcı tarafından oluşturulmuş

**Çözüm:**

1. Doğru proje ile giriş yaptığından emin ol
2. Supabase'da `postgres` kullanıcısı ile oturum açtığından emin ol
3. Yeni bir fonksiyon adı dene

### Hata 5: "Type does not exist"

**Hata Mesajı:**

```
ERROR: type public.availability_status does not exist
```

**Neden:** Gerekli enum type daha önce oluşturulmamış

**Çözüm:**

```sql
-- Önce enum type'ı oluştur
CREATE TYPE public.availability_status AS ENUM (
    'plenty',
    'limited',
    'out_of_stock'
);

-- Sonra fonksiyonu oluştur
CREATE FUNCTION get_supplier_product_catalog(...) ...
```

### Hata 6: "Relation does not exist"

**Hata Mesajı:**

```
ERROR: relation public.products does not exist
```

**Neden:** Tablo daha önce oluşturulmamış

**Çözüm:**

1. Önce tabloyu oluşturan migration dosyasını çalıştır
2. Tablo varlığını kontrol et:

```sql
-- Tablo varlığını kontrol et
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name = 'products';
```

### Hata 7: "DROP with signature"

**Hata Mesajı:**

```
ERROR: cannot drop function get_supplier_product_catalog because other objects depend on it
```

**Neden:** Diğer fonksiyonlar bu fonksiyonu kullanıyor

**Çözüm:**

```sql
-- CASCADE ile bağlı nesnelerle birlikte sil
DROP FUNCTION IF EXISTS get_supplier_product_catalog(UUID, INT, INT, TEXT, TEXT, BOOLEAN) CASCADE;

-- Sonra yeniden oluştur
CREATE OR REPLACE FUNCTION get_supplier_product_catalog(...) ...
```

---

## Ekstra İpuçları

### İpucu 1: SQL Kodunu Bölümler Halinde Çalıştır

Büyük SQL dosyalarında hata bulmak zordur. Bölümler halinde çalıştır:

```sql
-- BÖLÜM 1: DROP (Önce bunu çalıştır)
DROP FUNCTION IF EXISTS get_supplier_product_catalog(...);
-- RUN (Ctrl+Enter)

-- BÖLÜM 2: CREATE (Sonra bunu çalıştır)
CREATE FUNCTION get_supplier_product_catalog(...) ...
-- RUN (Ctrl+Enter)

-- BÖLÜM 3: GRANT (Son olarak bunu çalıştır)
GRANT EXECUTE ON FUNCTION get_supplier_product_catalog TO authenticated;
-- RUN (Ctrl+Enter)
```

### İpucu 2: Query'yi Kaydet

SQL Editor'da sorgunu kaydet:

1. **"Save"** butonuna tıkla
2. Anlamlı bir isim ver: `supplier-catalog-fix`
3. Sonra kolayca bulup tekrar çalıştırabilirsin

### İpucu 3: History Kullan

Çalıştırdığın tüm sorgular **History** bölümünde saklanır:

1. SQL Editor sol menüsünden **"History"** tıkla
2. Önceki sorgularını gör
3. Tekrar çalıştırmak için tıkla

### İpucu 4: Format Kullan

Karışık SQL kodunu düzenlemek için:

1. SQL kodunu seç
2. **"Format"** butonuna tıkla (veya `Shift + Alt + F`)
3. Kod otomatik olarak düzenlenir

### İpucu 5: Comment Satırlarını Kullan

SQL koduna açıklama ekle:

```sql
-- Bu fonksiyon tedarikçi ürün kataloğunu getirir
-- Author: Claude
-- Date: 2026-01-10

CREATE OR REPLACE FUNCTION get_supplier_product_catalog(...) ...
```

---

## Hızlı Referans Kartı

### Önemli Komutlar

| Komut | Açıklama |
|-------|----------|
| `DROP FUNCTION IF EXISTS name()` | Fonksiyonu sil |
| `CREATE FUNCTION name()` | Fonksiyon oluştur |
| `CREATE OR REPLACE FUNCTION name()` | Varsa replace et |
| `GRANT EXECUTE ON FUNCTION name()` | Execute yetkisi ver |

### Test Sorguları

```sql
-- 1. Tüm fonksiyonları listele
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public';

-- 2. Fonksiyon detaylarını gör
SELECT * FROM pg_proc WHERE proname LIKE '%supplier%';

-- 3. Yetkileri kontrol et
SELECT * FROM information_schema.routine_privileges
WHERE routine_schema = 'public';
```

---

## Sonraki Adımlar

1. ✅ SQL Migration başarıyla çalıştırıldı
2. ✅ Fonksiyonlar oluşturuldu
3. ✅ Test sorguları başarılı
4. ➡️ Şimdi uygulamadan fonksiyonu çağırabilirsin

**Örnek TypeScript Kullanımı:**

```typescript
// Supabase client ile RPC fonksiyonunu çağır
const { data, error } = await supabase
  .rpc('get_supplier_product_catalog', {
    p_supplier_id: null,
    p_page: 1,
    p_page_size: 50,
    p_category: null,
    p_search: null,
    p_only_active: true
  });

if (error) {
  console.error('RPC Error:', error);
} else {
  console.log('Products:', data);
}
```

---

## İhtiyaç Duyulduğunda

| Sorun | Kaynak |
|-------|--------|
| SQL syntax hatası | [PostgreSQL Dokümantasyonu](https://www.postgresql.org/docs/current/sql-commands.html) |
| Supabase kullanımı | [Supabase SQL Editor Docs](https://supabase.com/docs/guides/platform/sql-editor) |
| Bu rehberle ilgili | Proje README veya Issue |

---

**Son güncelleme:** 2026-01-10

**İpucu:** Bu rehbere favorilerinden erişebilirsin! 🚀
