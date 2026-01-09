-- ====================================================================
-- REALISTIC TEST DATA FOR ALIĞA & MENEMEN SUPPLIERS
-- Date: 2025-01-10
-- Purpose: Create realistic supplier accounts with products
-- ====================================================================

-- ====================================================================
-- STEP 1: CREATE SUPPLIER RECORDS
-- ====================================================================

-- Create supplier records (user_id will be updated after user creation via script)
INSERT INTO suppliers (id, user_id, name, contact_name, contact_phone, contact_email, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111111', NULL, 'Aliğa Toptancı', 'Ahmet Yılmaz', '+905551234567', 'supplier-aliaga@haldeki.com', true),
  ('22222222-2222-2222-2222-222222222222', NULL, 'Menemen Toptancı', 'Mehmet Demir', '+905557654321', 'supplier-menemen@haldeki.com', true)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- STEP 2: CREATE PRODUCTS FOR ALIĞA SUPPLIER (30 products)
-- ====================================================================

INSERT INTO products (id, name, slug, category, unit, description, origin, quality, price, stock, availability, is_active, created_at, updated_at)
VALUES
  ('a001', 'ABC BULAŞIK 4 LT BEYAZ MİSKET', 'abc-bulasik-4-lt-beyaz-misket', 'TEMİZLİK', 'paket', 'Kaliteli bulaşık deterjanı', 'Türkiye', 'standart', 50.00, 150, 'plenty', true, NOW(), NOW()),
  ('a002', 'ABC BULAŞIK 4 LT BEYAZ LAVANTA', 'abc-bulasik-4-lt-beyaz-lavanta', 'TEMİZLİK', 'paket', 'Lavantalı bulaşık deterjanı', 'Türkiye', 'standart', 50.00, 120, 'plenty', true, NOW(), NOW()),
  ('a003', 'ABC BULAŞIK 4 LT RENKLI LİMON', 'abc-bulasik-4-lt-renkli-limon', 'TEMİZLİK', 'paket', 'Limonalı renkli bulaşık deterjanı', 'Türkiye', 'standart', 52.00, 85, 'limited', true, NOW(), NOW()),
  ('a004', 'ABC BULAŞIK 1.5 KG TOZ BEYAZ', 'abc-bulasik-1-5-kg-toz-beyaz', 'TEMİZLİK', 'paket', 'Toz bulaşık deterjanı ekonomik paket', 'Türkiye', 'ekonomik', 35.00, 200, 'plenty', true, NOW(), NOW()),
  ('a005', 'ABC ÇAMAŞIR 4 LT SIVI BEYAZ', 'abc-camasir-4-lt-sivi-beyaz', 'TEMİZLİK', 'paket', 'Sıvı çamaşır deterjanı', 'Türkiye', 'standart', 55.00, 95, 'limited', true, NOW(), NOW()),
  ('a006', 'ABC ÇAMAŞIR 5 KG TOZ BEYAZ', 'abc-camasir-5-kg-toz-beyaz', 'TEMİZLİK', 'paket', 'Toz çamaşır deterjanı ekonomik', 'Türkiye', 'ekonomik', 40.00, 180, 'plenty', true, NOW(), NOW()),
  ('a007', 'ABC YIKAMA SUYU 1 LT LAVANTA', 'abc-yikama-suyu-1-lt-lavanta', 'TEMİZLİK', 'paket', 'Çamaşır yıkama suyu', 'Türkiye', 'standart', 25.00, 150, 'plenty', true, NOW(), NOW()),
  ('a008', 'ABC SIVI SABUN 1 LT MİSKET', 'abc-sivi-sabun-1-lt-misket', 'TEMİZLİK', 'paket', 'Genel amaçlı sıvı sabun', 'Türkiye', 'standart', 45.00, 110, 'limited', true, NOW(), NOW()),
  ('a009', 'ABC SIVI SABUN 1 LT LAVANTA', 'abc-sivi-sabun-1-lt-lavanta', 'TEMİZLİK', 'paket', 'Lavantalı sıvı sabun', 'Türkiye', 'standart', 45.00, 130, 'plenty', true, NOW(), NOW()),
  ('a010', 'ABC SIVI SABUN 500 ML LİMON', 'abc-sivi-sabun-500-ml-limon', 'TEMİZLİK', 'paket', 'Limonalı sıvı sabun', 'Türkiye', 'standart', 30.00, 90, 'limited', true, NOW(), NOW()),

  ('a011', 'ABC TUVALET KAĞIDI 12 LI *6', 'abc-tuvalet-kagidi-12-li-6', 'TEMİZLİK', 'paket', 'Ekonomik tuvalet kağıdı', 'Türkiye', 'ekonomik', 65.00, 200, 'plenty', true, NOW(), NOW()),
  ('a012', 'ABC TUVALET KAĞIDI 16 LI *4', 'abc-tuvalet-kagidi-16-li-4', 'TEMİZLİK', 'paket', 'Kaliteli tuvalet kağıdı', 'Türkiye', 'standart', 70.00, 160, 'plenty', true, NOW(), NOW()),
  ('a013', 'ABC MUTFAK HAVLUSU 50 LI *3', 'abc-mutfak-havlusu-50-li-3', 'TEMİZLİK', 'paket', 'Kağıt mutfak havlusu', 'Türkiye', 'standart', 45.00, 140, 'plenty', true, NOW(), NOW()),
  ('a014', 'ABC MUTFAK HAVLUSU 70 LI *2', 'abc-mutfak-havlusu-70-li-2', 'TEMİZLİK', 'paket', 'Büyük mutfak havlusu', 'Türkiye', 'standart', 50.00, 100, 'limited', true, NOW(), NOW()),
  ('a015', 'ABC PEÇETE 100 LI *4', 'abc-pecete-100-li-4', 'TEMİZLİK', 'paket', 'Kağıt peçete', 'Türkiye', 'ekonomik', 35.00, 250, 'plenty', true, NOW(), NOW()),

  ('a016', 'ABC ZEYTİN YAĞI 1 LT', 'abc-zeytin-yagi-1-lt', 'GIDA', 'paket', 'Natural zeytinyağı', 'Türkiye', 'premium', 95.00, 80, 'limited', true, NOW(), NOW()),
  ('a017', 'ABC ZEYTİN YAĞI 2 LT', 'abc-zeytin-yagi-2-lt', 'GIDA', 'paket', 'Ekonomik paket zeytinyağı', 'Türkiye', 'standart', 180.00, 120, 'plenty', true, NOW(), NOW()),
  ('a018', 'ABC AYÇEKMEK YAĞI 2 LT', 'abc-aycekmez-yagi-2-lt', 'GIDA', 'paket', 'Ayçekmezi yağı', 'Türkiye', 'ekonomik', 75.00, 150, 'plenty', true, NOW(), NOW()),
  ('a019', 'ABC MISIR ÖZÜ YAĞI 1.8 LT', 'abc-misir-ozu-yagi-1-8-lt', 'GIDA', 'paket', 'Misır özü yağı', 'Türkiye', 'ekonomik', 55.00, 200, 'plenty', true, NOW(), NOW()),
  ('a020', 'ABC SİRKE 1 LT', 'abc-sirke-1-lt', 'GIDA', 'paket', 'Elma sirkesi', 'Türkiye', 'standart', 25.00, 180, 'plenty', true, NOW(), NOW()),

  ('a021', 'ABC COLA 2 LT', 'abc-cola-2-lt', 'İÇECEK', 'paket', 'Kola', 'Türkiye', 'standart', 35.00, 200, 'plenty', true, NOW(), NOW()),
  ('a022', 'ABC COLA 330 ML *6', 'abc-cola-330-ml-6', 'İÇECEK', 'paket', 'Kola kutu', 'Türkiye', 'standart', 45.00, 150, 'plenty', true, NOW(), NOW()),
  ('a023', 'ABC MEYVE SUYU 1 LT PORTAKAL', 'abc-meyve-suyu-1-lt-portakal', 'İÇECEK', 'paket', 'Portakal suyu', 'Türkiye', 'standart', 30.00, 100, 'limited', true, NOW(), NOW()),
  ('a024', 'ABC MEYVE SUYU 1 LT ELMA', 'abc-meyve-suyu-1-lt-elma', 'İÇECEK', 'paket', 'Elma suyu', 'Türkiye', 'standart', 30.00, 110, 'limited', true, NOW(), NOW()),
  ('a025', 'ABC SU 0.5 LT *12', 'abc-su-0-5-lt-12', 'İÇECEK', 'paket', 'Maden suyu', 'Türkiye', 'standart', 40.00, 250, 'plenty', true, NOW(), NOW()),

  ('a026', 'ABC BİSKÜVI 300 GR', 'abc-biskuvi-300-gr', 'GIDA', 'paket', 'Kremalı bisküvi', 'Türkiye', 'standart', 22.00, 180, 'plenty', true, NOW(), NOW()),
  ('a027', 'ABC BİSKÜVI 300 GR ÇİKOLATA', 'abc-biskuvi-300-gr-cikolata', 'GIDA', 'paket', 'Çikolatalı bisküvi', 'Türkiye', 'standart', 25.00, 160, 'plenty', true, NOW(), NOW()),
  ('a028', 'ABC CIPS 150 GR', 'abc-cips-150-gr', 'GIDA', 'paket', 'Patates cipsi', 'Türkiye', 'standart', 18.00, 200, 'plenty', true, NOW(), NOW()),
  ('a029', 'ABC CIPS 150 GR BİBER', 'abc-cips-150-gr-biber', 'GIDA', 'paket', 'Biberli cips', 'Türkiye', 'standart', 18.00, 140, 'plenty', true, NOW(), NOW()),
  ('a030', 'ABC KURUYEMİŞ 200 GR', 'abc-kuruyemis-200-gr', 'GIDA', 'paket', 'Karışık kuruyemiş', 'Türkiye', 'premium', 55.00, 70, 'limited', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- STEP 3: CREATE PRODUCTS FOR MENEMEN SUPPLIER (30 products)
-- ====================================================================

INSERT INTO products (id, name, slug, category, unit, description, origin, quality, price, stock, availability, is_active, created_at, updated_at)
VALUES
  ('m001', 'XYZ BULAŞIK 4 LT BEYAZ MİSKET', 'xyz-bulasik-4-lt-beyaz-misket', 'TEMİZLİK', 'paket', 'Kaliteli bulaşık deterjanı', 'Türkiye', 'standart', 55.00, 130, 'plenty', true, NOW(), NOW()),
  ('m002', 'XYZ BULAŞIK 4 LT BEYAZ LAVANTA', 'xyz-bulasik-4-lt-beyaz-lavanta', 'TEMİZLİK', 'paket', 'Lavantalı bulaşık deterjanı', 'Türkiye', 'standart', 55.00, 140, 'plenty', true, NOW(), NOW()),
  ('m003', 'XYZ BULAŞIK 4 LT RENKLI LİMON', 'xyz-bulasik-4-lt-renkli-limon', 'TEMİZLİK', 'paket', 'Limonalı renkli bulaşık deterjanı', 'Türkiye', 'standart', 57.00, 95, 'limited', true, NOW(), NOW()),
  ('m004', 'XYZ BULAŞIK 1.5 KG TOZ BEYAZ', 'xyz-bulasik-1-5-kg-toz-beyaz', 'TEMİZLİK', 'paket', 'Toz bulaşık deterjanı ekonomik paket', 'Türkiye', 'ekonomik', 38.00, 190, 'plenty', true, NOW(), NOW()),
  ('m005', 'XYZ ÇAMAŞIR 4 LT SIVI BEYAZ', 'xyz-camasir-4-lt-sivi-beyaz', 'TEMİZLİK', 'paket', 'Sıvı çamaşır deterjanı', 'Türkiye', 'standart', 60.00, 105, 'limited', true, NOW(), NOW()),
  ('m006', 'XYZ ÇAMAŞIR 5 KG TOZ BEYAZ', 'xyz-camasir-5-kg-toz-beyaz', 'TEMİZLİK', 'paket', 'Toz çamaşır deterjanı ekonomik', 'Türkiye', 'ekonomik', 44.00, 170, 'plenty', true, NOW(), NOW()),
  ('m007', 'XYZ YIKAMA SUYU 1 LT LAVANTA', 'xyz-yikama-suyu-1-lt-lavanta', 'TEMİZLİK', 'paket', 'Çamaşır yıkama suyu', 'Türkiye', 'standart', 28.00, 145, 'plenty', true, NOW(), NOW()),
  ('m008', 'XYZ SIVI SABUN 1 LT MİSKET', 'xyz-sivi-sabun-1-lt-misket', 'TEMİZLİK', 'paket', 'Genel amaçlı sıvı sabun', 'Türkiye', 'standart', 50.00, 115, 'limited', true, NOW(), NOW()),
  ('m009', 'XYZ SIVI SABUN 1 LT LAVANTA', 'xyz-sivi-sabun-1-lt-lavanta', 'TEMİZLİK', 'paket', 'Lavantalı sıvı sabun', 'Türkiye', 'standart', 50.00, 125, 'plenty', true, NOW(), NOW()),
  ('m010', 'XYZ SIVI SABUN 500 ML LİMON', 'xyz-sivi-sabun-500-ml-limon', 'TEMİZLİK', 'paket', 'Limonalı sıvı sabun', 'Türkiye', 'standart', 33.00, 85, 'limited', true, NOW(), NOW()),

  ('m011', 'XYZ TUVALET KAĞIDI 12 LI *6', 'xyz-tuvalet-kagidi-12-li-6', 'TEMİZLİK', 'paket', 'Ekonomik tuvalet kağıdı', 'Türkiye', 'ekonomik', 70.00, 190, 'plenty', true, NOW(), NOW()),
  ('m012', 'XYZ TUVALET KAĞIDI 16 LI *4', 'xyz-tuvalet-kagidi-16-li-4', 'TEMİZLİK', 'paket', 'Kaliteli tuvalet kağıdı', 'Türkiye', 'standart', 75.00, 150, 'plenty', true, NOW(), NOW()),
  ('m013', 'XYZ MUTFAK HAVLUSU 50 LI *3', 'xyz-mutfak-havlusu-50-li-3', 'TEMİZLİK', 'paket', 'Kağıt mutfak havlusu', 'Türkiye', 'standart', 48.00, 130, 'plenty', true, NOW(), NOW()),
  ('m014', 'XYZ MUTFAK HAVLUSU 70 LI *2', 'xyz-mutfak-havlusu-70-li-2', 'TEMİZLİK', 'paket', 'Büyük mutfak havlusu', 'Türkiye', 'standart', 55.00, 95, 'limited', true, NOW(), NOW()),
  ('m015', 'XYZ PEÇETE 100 LI *4', 'xyz-pecete-100-li-4', 'TEMİZLİK', 'paket', 'Kağıt peçete', 'Türkiye', 'ekonomik', 38.00, 230, 'plenty', true, NOW(), NOW()),

  ('m016', 'XYZ ZEYTİN YAĞI 1 LT', 'xyz-zeytin-yagi-1-lt', 'GIDA', 'paket', 'Natural zeytinyağı', 'Türkiye', 'premium', 105.00, 75, 'limited', true, NOW(), NOW()),
  ('m017', 'XYZ ZEYTİN YAĞI 2 LT', 'xyz-zeytin-yagi-2-lt', 'GIDA', 'paket', 'Ekonomik paket zeytinyağı', 'Türkiye', 'standart', 195.00, 110, 'limited', true, NOW(), NOW()),
  ('m018', 'XYZ AYÇEKMEK YAĞI 2 LT', 'xyz-aycekmez-yagi-2-lt', 'GIDA', 'paket', 'Ayçekmezi yağı', 'Türkiye', 'ekonomik', 82.00, 140, 'plenty', true, NOW(), NOW()),
  ('m019', 'XYZ MISIR ÖZÜ YAĞI 1.8 LT', 'xyz-misir-ozu-yagi-1-8-lt', 'GIDA', 'paket', 'Misır özü yağı', 'Türkiye', 'ekonomik', 60.00, 190, 'plenty', true, NOW(), NOW()),
  ('m020', 'XYZ SİRKE 1 LT', 'xyz-sirke-1-lt', 'GIDA', 'paket', 'Elma sirkesi', 'Türkiye', 'standart', 28.00, 170, 'plenty', true, NOW(), NOW()),

  ('m021', 'XYZ COLA 2 LT', 'xyz-cola-2-lt', 'İÇECEK', 'paket', 'Kola', 'Türkiye', 'standart', 38.00, 190, 'plenty', true, NOW(), NOW()),
  ('m022', 'XYZ COLA 330 ML *6', 'xyz-cola-330-ml-6', 'İÇECEK', 'paket', 'Kola kutu', 'Türkiye', 'standart', 50.00, 140, 'plenty', true, NOW(), NOW()),
  ('m023', 'XYZ MEYVE SUYU 1 LT PORTAKAL', 'xyz-meyve-suyu-1-lt-portakal', 'İÇECEK', 'paket', 'Portakal suyu', 'Türkiye', 'standart', 33.00, 95, 'limited', true, NOW(), NOW()),
  ('m024', 'XYZ MEYVE SUYU 1 LT ELMA', 'xyz-meyve-suyu-1-lt-elma', 'İÇECEK', 'paket', 'Elma suyu', 'Türkiye', 'standart', 33.00, 100, 'limited', true, NOW(), NOW()),
  ('m025', 'XYZ SU 0.5 LT *12', 'xyz-su-0-5-lt-12', 'İÇECEK', 'paket', 'Maden suyu', 'Türkiye', 'standart', 44.00, 230, 'plenty', true, NOW(), NOW()),

  ('m026', 'XYZ BİSKÜVI 300 GR', 'xyz-biskuvi-300-gr', 'GIDA', 'paket', 'Kremalı bisküvi', 'Türkiye', 'standart', 24.00, 170, 'plenty', true, NOW(), NOW()),
  ('m027', 'XYZ BİSKÜVI 300 GR ÇİKOLATA', 'xyz-biskuvi-300-gr-cikolata', 'GIDA', 'paket', 'Çikolatalı bisküvi', 'Türkiye', 'standart', 28.00, 150, 'plenty', true, NOW(), NOW()),
  ('m028', 'XYZ CIPS 150 GR', 'xyz-cips-150-gr', 'GIDA', 'paket', 'Patates cipsi', 'Türkiye', 'standart', 20.00, 190, 'plenty', true, NOW(), NOW()),
  ('m029', 'XYZ CIPS 150 GR BİBER', 'xyz-cips-150-gr-biber', 'GIDA', 'paket', 'Biberli cips', 'Türkiye', 'standart', 20.00, 130, 'plenty', true, NOW(), NOW()),
  ('m030', 'XYZ KURUYEMİŞ 200 GR', 'xyz-kuruyemis-200-gr', 'GIDA', 'paket', 'Karışık kuruyemiş', 'Türkiye', 'premium', 60.00, 65, 'limited', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- STEP 4: CREATE SUPPLIER_PRODUCTS JUNCTION RECORDS
-- ====================================================================

-- Aliğa supplier products
INSERT INTO supplier_products (supplier_id, product_id, price, stock_quantity, availability, is_active, quality, origin, min_order_quantity, delivery_days)
SELECT
  '11111111-1111-1111-1111-111111111111'::UUID,
  id,
  price, -- Use base price from products table
  stock, -- Use stock from products table
  availability, -- Use availability from products table
  true,
  quality,
  'Türkiye',
  1,
  1
FROM products
WHERE id LIKE 'a%'
ON CONFLICT (supplier_id, product_id) DO NOTHING;

-- Menemen supplier products (10% higher prices)
INSERT INTO supplier_products (supplier_id, product_id, price, stock_quantity, availability, is_active, quality, origin, min_order_quantity, delivery_days)
SELECT
  '22222222-2222-2222-2222-222222222222'::UUID,
  id,
  price * 1.10, -- 10% higher than base price
  stock, -- Use stock from products table
  availability, -- Use availability from products table
  true,
  quality,
  'Türkiye',
  1,
  1
FROM products
WHERE id LIKE 'm%'
ON CONFLICT (supplier_id, product_id) DO NOTHING;

-- ====================================================================
-- VERIFICATION
-- ====================================================================

DO $$
DECLARE
  total_products INTEGER;
  aliaga_products INTEGER;
  menemen_products INTEGER;
  total_supplier_products INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_products FROM products;
  SELECT COUNT(*) INTO aliaga_products FROM products WHERE id LIKE 'a%';
  SELECT COUNT(*) INTO menemen_products FROM products WHERE id LIKE 'm%';
  SELECT COUNT(*) INTO total_supplier_products FROM supplier_products;

  RAISE NOTICE '=== REALISTIC TEST DATA VERIFICATION ===';
  RAISE NOTICE 'Total products: %', total_products;
  RAISE NOTICE 'Aliğa products: %', aliaga_products;
  RAISE NOTICE 'Menemen products: %', menemen_products;
  RAISE NOTICE 'Total supplier_products junction records: %', total_supplier_products;
  RAISE NOTICE 'Expected: 60 products (30+30), 60 junction records';
  RAISE NOTICE '========================================';
END $$;

-- Show suppliers
SELECT id, name, contact_email, is_active
FROM suppliers
WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
ORDER BY name;

-- ====================================================================
-- IMPORTANT NOTES
-- ====================================================================
-- 1. User accounts must be created via Supabase Auth API
-- 2. After user creation, update suppliers.user_id with actual auth.users IDs
-- 3. Run script: tsx scripts/create-aliaga-menemen-suppliers.ts
-- 4. Assign supplier role via user_roles table
-- 5. Grant region access via user_region_access table
-- ====================================================================
