-- ====================================================================
-- FIX: REALISTIC TEST DATA WITH PROPER UUIDS
-- Date: 2025-01-10
-- Purpose: Fix failed migration by using proper UUIDs for products
-- ====================================================================

-- Note: Previous migration failed due to UUID type mismatch
-- No cleanup needed as no data was inserted

-- ====================================================================
-- STEP 1: CREATE SUPPLIER RECORDS
-- ====================================================================

INSERT INTO suppliers (id, user_id, name, contact_name, contact_phone, contact_email, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111111', NULL, 'Aliğa Toptancı', 'Ahmet Yılmaz', '+905551234567', 'supplier-aliaga@haldeki.com', true),
  ('22222222-2222-2222-2222-222222222222', NULL, 'Menemen Toptancı', 'Mehmet Demir', '+905557654321', 'supplier-menemen@haldeki.com', true)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- STEP 2: CREATE PRODUCTS FOR ALIĞA SUPPLIER (30 products)
-- ====================================================================

-- Use gen_random_uuid() for proper UUID generation
WITH aliaga_products AS (
  SELECT
    gen_random_uuid() as id,
    unnest(ARRAY[
      'ABC BULAŞIK 4 LT BEYAZ MİSKET', 'ABC BULAŞIK 4 LT BEYAZ LAVANTA', 'ABC BULAŞIK 4 LT RENKLI LİMON',
      'ABC BULAŞIK 1.5 KG TOZ BEYAZ', 'ABC ÇAMAŞIR 4 LT SIVI BEYAZ', 'ABC ÇAMAŞIR 5 KG TOZ BEYAZ',
      'ABC YIKAMA SUYU 1 LT LAVANTA', 'ABC SIVI SABUN 1 LT MİSKET', 'ABC SIVI SABUN 1 LT LAVANTA', 'ABC SIVI SABUN 500 ML LİMON',
      'ABC TUVALET KAĞIDI 12 LI *6', 'ABC TUVALET KAĞIDI 16 LI *4', 'ABC MUTFAK HAVLUSU 50 LI *3',
      'ABC MUTFAK HAVLUSU 70 LI *2', 'ABC PEÇETE 100 LI *4',
      'ABC ZEYTİN YAĞI 1 LT', 'ABC ZEYTİN YAĞI 2 LT', 'ABC AYÇEKMEK YAĞI 2 LT', 'ABC MISIR ÖZÜ YAĞI 1.8 LT', 'ABC SİRKE 1 LT',
      'ABC COLA 2 LT', 'ABC COLA 330 ML *6', 'ABC MEYVE SUYU 1 LT PORTAKAL', 'ABC MEYVE SUYU 1 LT ELMA', 'ABC SU 0.5 LT *12',
      'ABC BİSKÜVI 300 GR', 'ABC BİSKÜVI 300 GR ÇİKOLATA', 'ABC CIPS 150 GR', 'ABC CIPS 150 GR BİBER', 'ABC KURUYEMİŞ 200 GR'
    ]) as name,
    unnest(ARRAY[
      'abc-bulasik-4-lt-beyaz-misket', 'abc-bulasik-4-lt-beyaz-lavanta', 'abc-bulasik-4-lt-renkli-limon',
      'abc-bulasik-1-5-kg-toz-beyaz', 'abc-camasir-4-lt-sivi-beyaz', 'abc-camasir-5-kg-toz-beyaz',
      'abc-yikama-suyu-1-lt-lavanta', 'abc-sivi-sabun-1-lt-misket', 'abc-sivi-sabun-1-lt-lavanta', 'abc-sivi-sabun-500-ml-limon',
      'abc-tuvalet-kagidi-12-li-6', 'abc-tuvalet-kagidi-16-li-4', 'abc-mutfak-havlusu-50-li-3',
      'abc-mutfak-havlusu-70-li-2', 'abc-pecete-100-li-4',
      'abc-zeytin-yagi-1-lt', 'abc-zeytin-yagi-2-lt', 'abc-aycekmez-yagi-2-lt', 'abc-misir-ozu-yagi-1-8-lt', 'abc-sirke-1-lt',
      'abc-cola-2-lt', 'abc-cola-330-ml-6', 'abc-meyve-suyu-1-lt-portakal', 'abc-meyve-suyu-1-lt-elma', 'abc-su-0-5-lt-12',
      'abc-biskuvi-300-gr', 'abc-biskuvi-300-gr-cikolata', 'abc-cips-150-gr', 'abc-cips-150-gr-biber', 'abc-kuruyemis-200-gr'
    ]) as slug,
    unnest(ARRAY[
      'Kaliteli bulaşık deterjanı', 'Lavantalı bulaşık deterjanı', 'Limonalı renkli bulaşık deterjanı',
      'Toz bulaşık deterjanı ekonomik paket', 'Sıvı çamaşır deterjanı', 'Toz çamaşır deterjanı ekonomik',
      'Çamaşır yıkama suyu', 'Genel amaçlı sıvı sabun', 'Lavantalı sıvı sabun', 'Limonalı sıvı sabun',
      'Ekonomik tuvalet kağıdı', 'Kaliteli tuvalet kağıdı', 'Kağıt mutfak havlusu',
      'Büyük mutfak havlusu', 'Kağıt peçete',
      'Natural zeytinyağı', 'Ekonomik paket zeytinyağı', 'Ayçekmezi yağı', 'Misır özü yağı', 'Elma sirkesi',
      'Kola', 'Kola kutu', 'Portakal suyu', 'Elma suyu', 'Maden suyu',
      'Kremalı bisküvi', 'Çikolatalı bisküvi', 'Patates cipsi', 'Biberli cips', 'Karışık kuruyemiş'
    ]) as description,
    unnest(ARRAY[
      'TEMİZLİK', 'TEMİZLİK', 'TEMİZLİK', 'TEMİZLİK', 'TEMİZLİK', 'TEMİZLİK',
      'TEMİZLİK', 'TEMİZLİK', 'TEMİZLİK', 'TEMİZLİK',
      'TEMİZLİK', 'TEMİZLİK', 'TEMİZLİK', 'TEMİZLİK', 'TEMİZLİK',
      'GIDA', 'GIDA', 'GIDA', 'GIDA', 'GIDA',
      'İÇECEK', 'İÇECEK', 'İÇECEK', 'İÇECEK', 'İÇECEK',
      'GIDA', 'GIDA', 'GIDA', 'GIDA', 'GIDA'
    ]) as category,
    unnest(ARRAY[
      50.00, 50.00, 52.00, 35.00, 55.00, 40.00,
      25.00, 45.00, 45.00, 30.00,
      65.00, 70.00, 45.00, 50.00, 35.00,
      95.00, 180.00, 75.00, 55.00, 25.00,
      35.00, 45.00, 30.00, 30.00, 40.00,
      22.00, 25.00, 18.00, 18.00, 55.00
    ]) as base_price,
    unnest(ARRAY[
      150, 120, 85, 200, 95, 180,
      150, 110, 130, 90,
      200, 160, 140, 100, 250,
      80, 120, 150, 200, 180,
      200, 150, 100, 110, 250,
      180, 160, 200, 140, 70
    ]) as stock,
    unnest(ARRAY['plenty'::public.availability_status, 'plenty', 'limited', 'plenty', 'limited', 'plenty',
      'plenty', 'limited', 'plenty', 'limited',
      'plenty', 'plenty', 'plenty', 'limited', 'plenty',
      'limited', 'plenty', 'plenty', 'plenty', 'plenty',
      'plenty', 'plenty', 'limited', 'limited', 'plenty',
      'plenty', 'plenty', 'plenty', 'plenty', 'limited']) as availability,
    unnest(ARRAY['standart'::public.quality_grade, 'standart', 'standart', 'ekonomik', 'standart', 'ekonomik',
      'standart', 'standart', 'standart', 'standart',
      'ekonomik', 'standart', 'standart', 'standart', 'ekonomik',
      'premium', 'standart', 'ekonomik', 'ekonomik', 'standart',
      'standart', 'standart', 'standart', 'standart', 'standart',
      'standart', 'standart', 'standart', 'standart', 'premium']) as quality
)
INSERT INTO products (id, name, slug, description, category, unit, base_price, origin, quality, availability, is_active, created_at, updated_at, stock, price)
SELECT
  id,
  name,
  slug,
  description,
  category,
  'paket',
  base_price,
  'Türkiye',
  quality,
  availability,
  true,
  NOW(),
  NOW(),
  stock,
  base_price
FROM aliaga_products
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- STEP 3: CREATE PRODUCTS FOR MENEMEN SUPPLIER (30 products)
-- ====================================================================

WITH menemen_products AS (
  SELECT
    gen_random_uuid() as id,
    unnest(ARRAY[
      'XYZ BULAŞIK 4 LT BEYAZ MİSKET', 'XYZ BULAŞIK 4 LT BEYAZ LAVANTA', 'XYZ BULAŞIK 4 LT RENKLI LİMON',
      'XYZ BULAŞIK 1.5 KG TOZ BEYAZ', 'XYZ ÇAMAŞIR 4 LT SIVI BEYAZ', 'XYZ ÇAMAŞIR 5 KG TOZ BEYAZ',
      'XYZ YIKAMA SUYU 1 LT LAVANTA', 'XYZ SIVI SABUN 1 LT MİSKET', 'XYZ SIVI SABUN 1 LT LAVANTA', 'XYZ SIVI SABUN 500 ML LİMON',
      'XYZ TUVALET KAĞIDI 12 LI *6', 'XYZ TUVALET KAĞIDI 16 LI *4', 'XYZ MUTFAK HAVLUSU 50 LI *3',
      'XYZ MUTFAK HAVLUSU 70 LI *2', 'XYZ PEÇETE 100 LI *4',
      'XYZ ZEYTİN YAĞI 1 LT', 'XYZ ZEYTİN YAĞI 2 LT', 'XYZ AYÇEKMEK YAĞI 2 LT', 'XYZ MISIR ÖZÜ YAĞI 1.8 LT', 'XYZ SİRKE 1 LT',
      'XYZ COLA 2 LT', 'XYZ COLA 330 ML *6', 'XYZ MEYVE SUYU 1 LT PORTAKAL', 'XYZ MEYVE SUYU 1 LT ELMA', 'XYZ SU 0.5 LT *12',
      'XYZ BİSKÜVI 300 GR', 'XYZ BİSKÜVI 300 GR ÇİKOLATA', 'XYZ CIPS 150 GR', 'XYZ CIPS 150 GR BİBER', 'XYZ KURUYEMİŞ 200 GR'
    ]) as name,
    unnest(ARRAY[
      'xyz-bulasik-4-lt-beyaz-misket', 'xyz-bulasik-4-lt-beyaz-lavanta', 'xyz-bulasik-4-lt-renkli-limon',
      'xyz-bulasik-1-5-kg-toz-beyaz', 'xyz-camasir-4-lt-sivi-beyaz', 'xyz-camasir-5-kg-toz-beyaz',
      'xyz-yikama-suyu-1-lt-lavanta', 'xyz-sivi-sabun-1-lt-misket', 'xyz-sivi-sabun-1-lt-lavanta', 'xyz-sivi-sabun-500-ml-limon',
      'xyz-tuvalet-kagidi-12-li-6', 'xyz-tuvalet-kagidi-16-li-4', 'xyz-mutfak-havlusu-50-li-3',
      'xyz-mutfak-havlusu-70-li-2', 'xyz-pecete-100-li-4',
      'xyz-zeytin-yagi-1-lt', 'xyz-zeytin-yagi-2-lt', 'xyz-aycekmez-yagi-2-lt', 'xyz-misir-ozu-yagi-1-8-lt', 'xyz-sirke-1-lt',
      'xyz-cola-2-lt', 'xyz-cola-330-ml-6', 'xyz-meyve-suyu-1-lt-portakal', 'xyz-meyve-suyu-1-lt-elma', 'xyz-su-0-5-lt-12',
      'xyz-biskuvi-300-gr', 'xyz-biskuvi-300-gr-cikolata', 'xyz-cips-150-gr', 'xyz-cips-150-gr-biber', 'xyz-kuruyemis-200-gr'
    ]) as slug,
    unnest(ARRAY[
      'Kaliteli bulaşık deterjanı', 'Lavantalı bulaşık deterjanı', 'Limonalı renkli bulaşık deterjanı',
      'Toz bulaşık deterjanı ekonomik paket', 'Sıvı çamaşır deterjanı', 'Toz çamaşır deterjanı ekonomik',
      'Çamaşır yıkama suyu', 'Genel amaçlı sıvı sabun', 'Lavantalı sıvı sabun', 'Limonalı sıvı sabun',
      'Ekonomik tuvalet kağıdı', 'Kaliteli tuvalet kağıdı', 'Kağıt mutfak havlusu',
      'Büyük mutfak havlusu', 'Kağıt peçete',
      'Natural zeytinyağı', 'Ekonomik paket zeytinyağı', 'Ayçekmezi yağı', 'Misır özü yağı', 'Elma sirkesi',
      'Kola', 'Kola kutu', 'Portakal suyu', 'Elma suyu', 'Maden suyu',
      'Kremalı bisküvi', 'Çikolatalı bisküvi', 'Patates cipsi', 'Biberli cips', 'Karışık kuruyemiş'
    ]) as description,
    unnest(ARRAY[
      'TEMİZLİK', 'TEMİZLİK', 'TEMİZLİK', 'TEMİZLİK', 'TEMİZLİK', 'TEMİZLİK',
      'TEMİZLİK', 'TEMİZLİK', 'TEMİZLİK', 'TEMİZLİK',
      'TEMİZLİK', 'TEMİZLİK', 'TEMİZLİK', 'TEMİZLİK', 'TEMİZLİK',
      'GIDA', 'GIDA', 'GIDA', 'GIDA', 'GIDA',
      'İÇECEK', 'İÇECEK', 'İÇECEK', 'İÇECEK', 'İÇECEK',
      'GIDA', 'GIDA', 'GIDA', 'GIDA', 'GIDA'
    ]) as category,
    unnest(ARRAY[
      55.00, 55.00, 57.00, 38.00, 60.00, 44.00,
      28.00, 50.00, 50.00, 33.00,
      70.00, 75.00, 48.00, 55.00, 38.00,
      105.00, 195.00, 82.00, 60.00, 28.00,
      38.00, 50.00, 33.00, 33.00, 44.00,
      24.00, 28.00, 20.00, 20.00, 60.00
    ]) as base_price,
    unnest(ARRAY[
      130, 140, 95, 190, 105, 170,
      145, 115, 125, 85,
      190, 150, 130, 95, 230,
      75, 110, 140, 190, 170,
      190, 140, 95, 100, 230,
      170, 150, 190, 130, 65
    ]) as stock,
    unnest(ARRAY['plenty'::public.availability_status, 'plenty', 'limited', 'plenty', 'limited', 'plenty',
      'plenty', 'limited', 'plenty', 'limited',
      'plenty', 'plenty', 'plenty', 'limited', 'plenty',
      'limited', 'limited', 'plenty', 'plenty', 'plenty',
      'plenty', 'plenty', 'limited', 'limited', 'plenty',
      'plenty', 'plenty', 'plenty', 'plenty', 'limited']) as availability,
    unnest(ARRAY['standart'::public.quality_grade, 'standart', 'standart', 'ekonomik', 'standart', 'ekonomik',
      'standart', 'standart', 'standart', 'standart',
      'ekonomik', 'standart', 'standart', 'standart', 'ekonomik',
      'premium', 'standart', 'ekonomik', 'ekonomik', 'standart',
      'standart', 'standart', 'standart', 'standart', 'standart',
      'standart', 'standart', 'standart', 'standart', 'premium']) as quality
)
INSERT INTO products (id, name, slug, description, category, unit, base_price, origin, quality, availability, is_active, created_at, updated_at, stock, price)
SELECT
  id,
  name,
  slug,
  description,
  category,
  'paket',
  base_price,
  'Türkiye',
  quality,
  availability,
  true,
  NOW(),
  NOW(),
  stock,
  base_price
FROM menemen_products
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- STEP 4: CREATE SUPPLIER_PRODUCTS JUNCTION RECORDS
-- ====================================================================

-- Aliğa supplier products (30 ABC brand products)
INSERT INTO supplier_products (supplier_id, product_id, price, stock_quantity, availability, is_active, quality, origin, min_order_quantity, delivery_days)
SELECT
  '11111111-1111-1111-1111-111111111111'::UUID,
  p.id,
  p.base_price,
  p.stock,
  p.availability,
  true,
  p.quality,
  'Türkiye',
  1,
  1
FROM products p
WHERE p.name LIKE 'ABC %'
ON CONFLICT (supplier_id, product_id) DO NOTHING;

-- Menemen supplier products (30 XYZ brand products - 10% higher prices)
INSERT INTO supplier_products (supplier_id, product_id, price, stock_quantity, availability, is_active, quality, origin, min_order_quantity, delivery_days)
SELECT
  '22222222-2222-2222-2222-222222222222'::UUID,
  p.id,
  p.base_price * 1.10,
  p.stock,
  p.availability,
  true,
  p.quality,
  'Türkiye',
  1,
  1
FROM products p
WHERE p.name LIKE 'XYZ %'
ON CONFLICT (supplier_id, product_id) DO NOTHING;

-- ====================================================================
-- VERIFICATION
-- ====================================================================

DO $$
DECLARE
  total_suppliers INTEGER;
  total_products INTEGER;
  aliaga_products INTEGER;
  menemen_products INTEGER;
  total_supplier_products INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_suppliers FROM suppliers WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
  SELECT COUNT(*) INTO total_products FROM products;
  SELECT COUNT(*) INTO aliaga_products FROM products WHERE name LIKE 'ABC %';
  SELECT COUNT(*) INTO menemen_products FROM products WHERE name LIKE 'XYZ %';
  SELECT COUNT(*) INTO total_supplier_products FROM supplier_products;

  RAISE NOTICE '=== REALISTIC TEST DATA VERIFICATION ===';
  RAISE NOTICE 'Total suppliers: %', total_suppliers;
  RAISE NOTICE 'Total products: %', total_products;
  RAISE NOTICE 'Aliğa products (ABC): %', aliaga_products;
  RAISE NOTICE 'Menemen products (XYZ): %', menemen_products;
  RAISE NOTICE 'Total supplier_products junction records: %', total_supplier_products;
  RAISE NOTICE 'Expected: 2 suppliers, 60 products (30+30), 60 junction records';
  RAISE NOTICE '========================================';
END $$;

-- Show suppliers
SELECT id, name, contact_email, is_active
FROM suppliers
WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
ORDER BY name;
