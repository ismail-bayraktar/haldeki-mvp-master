# Supabase Migration Sorun Giderme Rehberi

> Yeni başlayanlar için yaygın migration hataları ve çözümleri

---

## Hızlı Arama

| Hata Mesajı | Çözüm |
|--------------|-------|
| `function already exists` | DROP IF EXISTS kullan |
| `syntax error` | SQL kodunu kontrol et |
| `permission denied` | Yetki ver |
| `relation does not exist` | Tabloyu oluştur |
| `type does not exist` | Type'ı önce oluştur |
| `must be owner` | Doğru kullanıcı ile giriş yap |

---

## 1. Fonksiyon Hataları

### Hata: "function already exists"

**Örnek Hata:**
```
ERROR: function get_supplier_product_catalog(uuid, integer, integer, text, text, boolean) already exists
```

**Neden:** Fonksiyon zaten var

**Çözüm 1: DROP ile sil**
```sql
DROP FUNCTION IF EXISTS get_supplier_product_catalog CASCADE;
```

**Çözüm 2: CREATE OR REPLACE kullan**
```sql
CREATE OR REPLACE FUNCTION get_supplier_product_catalog(...) ...
```

**Not:** PostgreSQL'de fonksiyon imzası değiştiyse OR REPLACE çalışmaz. Önce DROP kullanmalısın.

---

### Hata: "function signature mismatch"

**Örnek Hata:**
```
ERROR: function get_supplier_product_catalog(uuid, integer) does not exist
```

**Neden:** Parametre sayısı veya tipleri uyuşmuyor

**Çözüm:**
```sql
-- Önce mevcut fonksiyonun imzasını kontrol et
SELECT
    proname as function_name,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'get_supplier_product_catalog';

-- Doğru parametrelerle çağır
SELECT * FROM get_supplier_product_catalog(
    NULL,   -- supplier_id
    1,      -- page
    10      -- page_size
);
```

---

### Hata: "cannot drop function because other objects depend on it"

**Örnek Hata:**
```
ERROR: cannot drop function get_supplier_product_catalog because other objects depend on it
DETAIL: function upsert_supplier_products depends on function get_supplier_product_catalog
```

**Neden:** Diğer fonksiyonlar bu fonksiyonu kullanıyor

**Çözüm: CASCADE kullan**
```sql
DROP FUNCTION IF EXISTS get_supplier_product_catalog CASCADE;
```

---

## 2. Syntax Hataları

### Hata: "syntax error at or near"

**Örnek Hata:**
```
ERROR: syntax error at or near "CREATE"
LINE 3: CREATE FUNCTION test() ...
```

**Neden:** SQL kodunda yazım hatası

**Çözüm:**

**1. Parantez kontrolü**
```sql
-- ❌ YANLIŞ - Parantez kapalı değil
CREATE FUNCTION test(
    param1 TEXT
RETURNS UUID AS $$ ...  -- ) eksik

-- ✅ DOĞRU
CREATE FUNCTION test(
    param1 TEXT
) RETURNS UUID AS $$ ...
```

**2. $$ kapatma kontrolü**
```sql
-- ❌ YANLIŞ - $$ kapatılmamış
CREATE FUNCTION test() ...
BEGIN
    RETURN 1;
END;
$$ LANGUAGE plpgsql  -- $$ eksik

-- ✅ DOĞRU
CREATE FUNCTION test() ...
BEGIN
    RETURN 1;
END;
$$ LANGUAGE plpgsql;
```

**3. Virgül kontrolü**
```sql
-- ❌ YANLIŞ - Virgül eksik
SELECT
    id
    name  -- Virgül eksik
FROM users;

-- ✅ DOĞRU
SELECT
    id,
    name
FROM users;
```

---

### Hata: "unterminated dollar-quoted string"

**Örnek Hata:**
```
ERROR: unterminated dollar-quoted string at or near "$$
```

**Neden:** $$ işaretleri eşleşmiyor

**Çözüm:**
```sql
-- Her $$ için kapanış $$ olmalı
CREATE FUNCTION test()
RETURNS UUID AS $$
BEGIN
    RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;  -- Kapanış $$ var
```

---

## 3. Permission Hataları

### Hata: "permission denied for function"

**Örnek Hata:**
```
ERROR: permission denied for function get_supplier_product_catalog
```

**Neden:** Execute yetkisi verilmemiş

**Çözüm 1: Yetki ver**
```sql
GRANT EXECUTE ON FUNCTION get_supplier_product_catalog TO authenticated;
```

**Çözüm 2: Security Definer kullan**
```sql
CREATE FUNCTION test()
RETURNS UUID
SECURITY DEFINER SET search_path = public
$$ ...
```

**Not:** SECURITY DEFINER ile fonksiyon, sahibinin yetkileriyle çalışır.

---

### Hata: "must be owner of function"

**Örnek Hata:**
```
ERROR: must be owner of function get_supplier_product_catalog
```

**Neden:** Başka bir kullanıcı tarafından oluşturulmuş

**Çözüm:**

1. Doğru proje ile giriş yaptığından emin ol
2. Supabase'da doğru hesapla oturum açtığını kontrol et
3. Yeni bir fonksiyon adı dene

---

## 4. Relation Hataları

### Hata: "relation does not exist"

**Örnek Hata:**
```
ERROR: relation "public.products" does not exist
```

**Neden:** Tablo henüz oluşturulmadı

**Çözüm 1: Tabloyu kontrol et**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name = 'products';
```

**Çözüm 2: Tabloyu önce oluştur**
```sql
-- Önce: products tablosunu oluştur
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL
);

-- Sonra: fonksiyonu oluştur
CREATE FUNCTION get_products() ...
```

**Çözüm 3: Schema prefix kullan**
```sql
-- Tablonun başka bir schema'da olabilir
SELECT * FROM my_schema.products;
```

---

### Hata: "column does not exist"

**Örnek Hata:**
```
ERROR: column products.price does not exist
```

**Neden:** Sütun adı yanlış veya tabloda yok

**Çözüm:**
```sql
-- Tablo yapısını kontrol et
SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- Doğru sütun adını kullan
```

---

## 5. Type Hataları

### Hata: "type does not exist"

**Örnek Hata:**
```
ERROR: type "public.availability_status" does not exist
```

**Neden:** Enum type daha önce oluşturulmamış

**Çözüm 1: Type'ı oluştur**
```sql
-- Önce: enum type'ı oluştur
CREATE TYPE public.availability_status AS ENUM (
    'plenty',
    'limited',
    'out_of_stock'
);

-- Sonra: fonksiyonu oluştur
CREATE FUNCTION get_products() ...
```

**Çözüm 2: Varsa kontrol et**
```sql
-- Type varlığını kontrol et
SELECT typname
FROM pg_type
WHERE typname = 'availability_status';
```

---

### Hata: "argument types must match"

**Örnek Hata:**
```
ERROR: argument types must match: TEXT != INTEGER
```

**Neden:** Parametre tipi uyuşmazlığı

**Çözüm:**
```sql
-- Doğru tipi kullan
SELECT * FROM my_function(
    'text_param',   -- TEXT
    123,            -- INTEGER
    true            -- BOOLEAN
);
```

---

## 6. Constraint Hataları

### Hata: "null value in column violates not-null constraint"

**Örnek Hata:**
```
ERROR: null value in column "name" violates not-null constraint
```

**Neden:** Zorunlu alana null değer girilmeye çalışılıyor

**Çözüm:**
```sql
-- NULL olmayan alanları doldur
INSERT INTO products (name, price) VALUES ('Ürün', 10.0);

-- Veya DEFAULT değeri tanımla
CREATE TABLE products (
    name TEXT NOT NULL DEFAULT 'İsimsiz'
);
```

---

### Hata: "duplicate key value violates unique constraint"

**Örnek Hata:**
```
ERROR: duplicate key value violates unique constraint "products_email_key"
```

**Neden:** Unique alanda tekrarlı değer

**Çözüm:**
```sql
-- Önce var olan kaydı kontrol et
SELECT * FROM products WHERE email = 'test@test.com';

-- Veya ON CONFLICT kullan
INSERT INTO products (email, name)
VALUES ('test@test.com', 'Test')
ON CONFLICT (email) DO UPDATE
SET name = EXCLUDED.name;
```

---

### Hata: "foreign key violation"

**Örnek Hata:**
```
ERROR: insert or update on table violates foreign key constraint
```

**Neden:** İlişkili tabloda kayıt yok

**Çözüm:**
```sql
-- Önce parent tabloya kayıt ekle
INSERT INTO suppliers (id, name) VALUES (...);

-- Sonra child tabloya ekle
INSERT INTO products (supplier_id, name) VALUES (...);
```

---

## 7. RLS ve Security Hataları

### Hata: "new row violates row-level security policy"

**Örnek Hata:**
```
ERROR: new row violates row-level security policy for table "products"
```

**Neden:** RLS politikası izin vermiyor

**Çözüm 1: Politikanı kontrol et**
```sql
SELECT * FROM pg_policies
WHERE tablename = 'products';
```

**Çözüm 2: RLS'yi geçici kapat**
```sql
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
```

**Çözüm 3: Supabase auth kontrolü yap**
```sql
-- auth.uid() null mu kontrol et
SELECT auth.uid();

-- Veya test için hardcode UUID kullan
-- (Sadece test ortamında!)
```

---

## 8. Migration Sıra Hataları

### Sorun: Migration'lar yanlış sırada çalışıyor

**Belirtiler:**
- Tablo bulunamıyor
- Fonksiyon daha önce çalışıyor

**Çözüm:**
```
Doğru sıra:
1. Enum type'ları oluştur
2. Tabloları oluştur
3. İndeksleri oluştur
4. Fonksiyonları oluştur
5. RLS politikalarını oluştur
6. Test verisini ekle
```

**Örnek doğru migration sırası:**
```
20260110000000_create_enums.sql          ← 1. Önce enum'lar
20260110010000_create_tables.sql         ← 2. Sonra tablolar
20260110020000_create_indexes.sql        ← 3. İndeksler
20260110030000_create_functions.sql      ← 4. Fonksiyonlar
20260110040000_create_rls_policies.sql   ← 5. RLS
20260110050000_seed_data.sql             ← 6. Veri
```

---

## 9. Debug İpuçları

### 1. Adım Adım Çalıştır

```sql
-- Bölüm 1
DROP FUNCTION IF EXISTS test CASCADE;
-- RUN

-- Bölüm 2
CREATE FUNCTION test() ...
-- RUN

-- Bölüm 3
GRANT EXECUTE ON FUNCTION test TO authenticated;
-- RUN
```

### 2. PRINT ile Debug

```sql
CREATE OR REPLACE FUNCTION test_debug()
RETURNS void AS $$
BEGIN
    RAISE NOTICE 'Değer: %', 'test';
    RAISE NOTICE 'User ID: %', auth.uid();
END;
$$ LANGUAGE plpgsql;
```

### 3. SELECT ile Test Et

```sql
-- Her adımda sonuçları kontrol et
SELECT 1;  -- Test 1
SELECT 2;  -- Test 2
SELECT * FROM my_function();  -- Gerçek test
```

### 4. Transaction kullan

```sql
BEGIN;
-- SQL kodlarını buraya çalıştır
-- Hata varsa ROLLBACK, yoksa COMMIT
COMMIT;  -- veya ROLLBACK;
```

---

## 10. Supabase Özel İpuçları

### Supabase Auth Kontrolü

```sql
-- Auth UID'yi gör
SELECT auth.uid();

-- Auth rolünü gör
SELECT auth.jwt();

-- Tüm auth kullanıcıları
SELECT * FROM auth.users;
```

### Supabase Migration Durumu

```sql
-- Migration geçmişini gör
SELECT * FROM schema_migrations
ORDER BY applied_at DESC;

-- Son migration
SELECT * FROM schema_migrations
ORDER BY applied_at DESC
LIMIT 1;
```

---

## Hızlı Çözüm Şeması

```
HATA ALDIM
    ↓
1. Hata mesajını oku
    ↓
2. Nedenini anla (bu rehberden bak)
    ↓
3. Çözümü uygula
    ↓
4. Tekrar çalıştır
    ↓
5. Hala hata var mı?
    ├─ Evet → Supabase loglarını kontrol et
    └─ Hayır → Başarılı! 🎉
```

---

## Yardım Alabileceğin Kaynaklar

| Kaynak | Link |
|---------|------|
| Supabase Docs | https://supabase.com/docs |
| PostgreSQL Docs | https://www.postgresql.org/docs/ |
| Bu proje | GitHub Issues |

---

**Son güncelleme:** 2026-01-10

**İpucu:** Hata mesajını kopyala, bu dokümanda ara (Ctrl+F) 🚀
