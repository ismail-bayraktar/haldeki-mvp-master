# Supabase SQL Hızlı Referans Kartı

> Yeni başlayanlar için sık kullanılan SQL komutları

---

## Fonksiyon Yönetimi

### Fonksiyon Oluştur

```sql
CREATE OR REPLACE FUNCTION my_function(
    param1 TEXT,
    param2 INT DEFAULT 1
)
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object('result', param1);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
```

### Fonksiyon Sil

```sql
-- Basit drop
DROP FUNCTION IF EXISTS my_function CASCADE;

-- Parametre tipleri ile drop (eski yöntem)
DROP FUNCTION IF EXISTS my_function(TEXT, INT) CASCADE;
```

### Fonksiyon Listele

```sql
-- Tüm fonksiyonları göster
SELECT
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

### Fonksiyon Detaylarını Gör

```sql
-- Belirli bir fonksiyonun detayları
SELECT
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname = 'my_function';
```

---

## Fonksiyon Test Etme

### Basit Test

```sql
-- Parametresiz fonksiyon
SELECT * FROM my_function();

-- Parametreli fonksiyon
SELECT * FROM my_function('test', 123);
```

### Sonuçları Görüntüle

```sql
-- Sonuçları tablo olarak göster
SELECT * FROM get_supplier_product_catalog(
    NULL,   -- supplier_id
    1,      -- page
    10,     -- page_size
    NULL,   -- category
    NULL,   -- search
    true    -- only_active
);
```

---

## Yetki Yönetimi

### Execute Yetkisi Ver

```sql
GRANT EXECUTE ON FUNCTION my_function TO authenticated;
GRANT EXECUTE ON FUNCTION my_function TO anon;
GRANT EXECUTE ON FUNCTION my_function TO service_role;
```

### Yetkileri Görüntüle

```sql
-- Fonksiyon yetkilerini listele
SELECT
    routine_name,
    grantee,
    privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
    AND routine_name = 'my_function';
```

### Yetki Geri Al

```sql
REVOKE EXECUTE ON FUNCTION my_function FROM authenticated;
```

---

## Tablo Yönetimi

### Tablo Oluştur

```sql
CREATE TABLE my_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tablo Listele

```sql
-- Tüm tabloları göster
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Tablo Yapısını Gör

```sql
-- Tablo sütunlarını göster
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'my_table'
ORDER BY ordinal_position;
```

### Tablo Sil

```sql
DROP TABLE IF EXISTS my_table CASCADE;
```

---

## Veri Yönetimi

### Veri Ekle (INSERT)

```sql
-- Tek kayıt
INSERT INTO my_table (name) VALUES ('test');

-- Çoklu kayıt
INSERT INTO my_table (name) VALUES
    ('test1'),
    ('test2'),
    ('test3');
```

### Veri Güncelle (UPDATE)

```sql
UPDATE my_table
SET name = 'yeni isim'
WHERE id = 'uuid-buraya';
```

### Veri Sil (DELETE)

```sql
DELETE FROM my_table
WHERE id = 'uuid-buraya';

-- Tüm tabloyu temizle
TRUNCATE TABLE my_table;
```

### Veri Sorgula (SELECT)

```sql
-- Tüm kayıtlar
SELECT * FROM my_table;

-- Belirli sütunlar
SELECT id, name FROM my_table;

-- Filtreli
SELECT * FROM my_table
WHERE name LIKE '%test%'

-- Sıralı
SELECT * FROM my_table
ORDER BY created_at DESC
LIMIT 10;
```

---

## Migration Yönetimi

### Migration Geçmişi

```sql
-- Migration geçmişini gör
SELECT * FROM public.schema_migrations
ORDER BY applied_at DESC;
```

### Migration Ekle

```sql
INSERT INTO public.schema_migrations (
    migration_name,
    description,
    applied_at
) VALUES (
    'my_new_migration',
    'Migration açıklaması',
    NOW()
) ON CONFLICT (migration_name) DO NOTHING;
```

---

## Hata Ayıklama

### Hata Mesajını Gör

```sql
-- Son hata mesajını gör
SELECT * FROM pg_stat_activity
WHERE state = 'active';

-- Veya
SELECT * FROM pg_stat_activity
WHERE query NOT LIKE '%pg_stat_activity%';
```

### Log Kayıtları

```sql
-- PostgreSQL loglarını gör (Supabase Dashboard'da)
-- Database > Logs bölümünden
```

---

## Enum Type Yönetimi

### Enum Oluştur

```sql
CREATE TYPE my_enum AS ENUM (
    'value1',
    'value2',
    'value3'
);
```

### Enum Listele

```sql
-- Tüm enum type'ları gör
SELECT typname, enumlabel
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
ORDER BY typname, enumsortorder;
```

### Enum Değer Ekle

```sql
-- PostgreSQL'de enum'a yeni değer eklemek için:
ALTER TYPE my_enum ADD VALUE 'value4' BEFORE 'value2';
```

---

## Yararlı Fonksiyonlar

### UUID Oluştur

```sql
SELECT gen_random_uuid();
```

### Zaman Damgası

```sql
SELECT NOW();
-- veya
SELECT CURRENT_TIMESTAMP;
```

### JSON İşlemleri

```sql
-- JSON oluşturur
SELECT jsonb_build_object('key', 'value');

-- JSON birleştirir
SELECT jsonb_build_object(
    'name', 'John',
    'age', 30,
    'active', true
);

-- JSON'dan değer okur
SELECT '{"name": "John"}'->>'name';
```

---

## İndeks Yönetimi

### İndeks Oluştur

```sql
-- Basit indeks
CREATE INDEX idx_my_table_name ON my_table(name);

-- Kompozit indeks
CREATE INDEX idx_my_table_name_date ON my_table(name, created_at);

-- Unique indeks
CREATE UNIQUE INDEX idx_my_table_email ON my_table(email);

-- Partial indeks
CREATE INDEX idx_my_table_active ON my_table(created_at)
WHERE is_active = true;
```

### İndeks Listele

```sql
-- Tablo indekslerini gör
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'my_table';
```

### İndeks Sil

```sql
DROP INDEX IF EXISTS idx_my_table_name;
```

---

## Performans İpuçları

### EXPLAIN ile Sorgu Analizi

```sql
-- Sorgu planını gör
EXPLAIN SELECT * FROM my_table WHERE name = 'test';

-- Detaylı analiz (sorguyu çalıştırır)
EXPLAIN ANALYZE SELECT * FROM my_table WHERE name = 'test';
```

### VACUUM ve ANALYZE

```sql
-- Tabloyu temizle ve istatistikleri güncelle
VACUUM ANALYZE my_table;

-- Tüm veritabanı için
VACUUM ANALYZE;
```

---

## Klavye Kısayolları (SQL Editor)

| Kısayol | İşlev |
|---------|-------|
| `Ctrl + Enter` | Sorguyu çalıştır (RUN) |
| `Ctrl + S` | Sorguyu kaydet |
| `Ctrl + /` | Satırı yorum yap |
| `Ctrl + Shift + /` | Block comment |
| `Shift + Alt + F` | Kodu formatla |
| `Ctrl + F` | Bul |
| `Ctrl + H` | Değiştir |
| `Ctrl + G` | Satıra git |

---

## Yeni Başlayanlar İçin İpucu

1. **Yedek Al:** Önce test ortamında dene
2. **Adım Adım:** Büyük sorguları böl
3. **Test Et:** Her değişiklikten sonra test et
4. **Logları Kontrol Et:** Hata varsa logları oku
5. **Dökümantasyon:** Koduna yorum ekle

---

**Son güncelleme:** 2026-01-10
