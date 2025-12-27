-- ============================================================================
-- HALDEKI.COM - SEED DATA
-- ============================================================================
-- Bu dosya başlangıç verilerini içerir.
-- full-schema.sql çalıştırıldıktan SONRA bu dosyayı çalıştırın.
-- 
-- Tarih: 2025-12-26
-- ============================================================================

-- ============================================================================
-- BÖLÜM 1: BÖLGELER (REGIONS)
-- ============================================================================

INSERT INTO public.regions (name, slug, is_active, delivery_slots) VALUES
  (
    'Menemen',
    'menemen',
    true,
    '[
      {"day": "Pazartesi", "time_slots": ["09:00-12:00", "14:00-18:00"]},
      {"day": "Çarşamba", "time_slots": ["09:00-12:00", "14:00-18:00"]},
      {"day": "Cuma", "time_slots": ["09:00-12:00", "14:00-18:00"]}
    ]'::jsonb
  ),
  (
    'Aliağa',
    'aliaga',
    true,
    '[
      {"day": "Salı", "time_slots": ["09:00-12:00", "14:00-18:00"]},
      {"day": "Perşembe", "time_slots": ["09:00-12:00", "14:00-18:00"]},
      {"day": "Cumartesi", "time_slots": ["09:00-12:00"]}
    ]'::jsonb
  ),
  (
    'Foça',
    'foca',
    true,
    '[
      {"day": "Pazartesi", "time_slots": ["10:00-14:00"]},
      {"day": "Perşembe", "time_slots": ["10:00-14:00"]}
    ]'::jsonb
  ),
  (
    'Bergama',
    'bergama',
    true,
    '[
      {"day": "Salı", "time_slots": ["10:00-14:00"]},
      {"day": "Cuma", "time_slots": ["10:00-14:00"]}
    ]'::jsonb
  ),
  (
    'Dikili',
    'dikili',
    true,
    '[
      {"day": "Çarşamba", "time_slots": ["10:00-14:00"]},
      {"day": "Cumartesi", "time_slots": ["10:00-14:00"]}
    ]'::jsonb
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- BÖLÜM 2: ÜRÜNLER (PRODUCTS)
-- ============================================================================

INSERT INTO public.products (
  name, slug, description, category, unit, base_price, 
  images, origin, quality, availability, price_change, 
  is_bugun_halde, is_active
) VALUES
-- Meyveler
  ('Kırmızı Elma', 'kirmizi-elma', 'Isparta''nın bereketli topraklarından taze kırmızı elmalar.', 'meyveler', 'kg', 32.50, 
   ARRAY['https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=400&h=400&fit=crop'], 'Isparta', 'premium', 'plenty', 'down', true, true),
  
  ('Muz', 'muz', 'Anamur''un meşhur tatlı muzları.', 'meyveler', 'kg', 54.00, 
   ARRAY['https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400&h=400&fit=crop'], 'Anamur', 'premium', 'limited', 'up', true, true),
  
  ('Çilek', 'cilek', 'Antalya seralarından taze çilekler.', 'meyveler', 'kg', 89.00, 
   ARRAY['https://images.unsplash.com/photo-1543528176-61b239494933?w=400&h=400&fit=crop'], 'Antalya', 'premium', 'last', 'stable', true, true),
  
  ('Armut', 'armut', 'Bursa''nın tatlı armutları.', 'meyveler', 'kg', 28.00, 
   ARRAY['https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=400&h=400&fit=crop'], 'Bursa', 'standart', 'plenty', 'stable', false, true),
  
  ('Üzüm', 'uzum', 'Manisa''nın meşhur üzümleri.', 'meyveler', 'kg', 45.00, 
   ARRAY['https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&h=400&fit=crop'], 'Manisa', 'premium', 'plenty', 'stable', true, true),
  
  ('Karpuz', 'karpuz', 'Diyarbakır karpuzu - tatlı ve sulu.', 'meyveler', 'kg', 8.00, 
   ARRAY['https://images.unsplash.com/photo-1589984662646-e7b2e4f53af8?w=400&h=400&fit=crop'], 'Diyarbakır', 'premium', 'plenty', 'down', true, true),
  
  ('Kavun', 'kavun', 'Şeker gibi tatlı kavunlar.', 'meyveler', 'kg', 12.00, 
   ARRAY['https://images.unsplash.com/photo-1571575173700-afb9492e6a50?w=400&h=400&fit=crop'], 'Kırklareli', 'standart', 'plenty', 'stable', false, true),

-- Sebzeler
  ('Domates', 'domates', 'Antalya''nın güneşinde yetişen domatesler.', 'sebzeler', 'kg', 24.00, 
   ARRAY['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=400&fit=crop'], 'Antalya', 'premium', 'plenty', 'down', true, true),
  
  ('Salatalık', 'salatalik', 'Adana''dan taze salatalıklar.', 'sebzeler', 'kg', 18.50, 
   ARRAY['https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=400&h=400&fit=crop'], 'Adana', 'premium', 'plenty', 'stable', true, true),
  
  ('Biber (Sivri)', 'biber-sivri', 'Maraş''ın acı biberleri.', 'sebzeler', 'kg', 22.00, 
   ARRAY['https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=400&h=400&fit=crop'], 'Kahramanmaraş', 'premium', 'limited', 'up', false, true),
  
  ('Patlıcan', 'patlican', 'İzmir''in lezzetli patlıcanları.', 'sebzeler', 'kg', 19.00, 
   ARRAY['https://images.unsplash.com/photo-1628773822503-930a7eaecf80?w=400&h=400&fit=crop'], 'İzmir', 'standart', 'plenty', 'stable', false, true),
  
  ('Kabak', 'kabak', 'Taze kabaklar.', 'sebzeler', 'kg', 15.00, 
   ARRAY['https://images.unsplash.com/photo-1563252722-6434563a985d?w=400&h=400&fit=crop'], 'Bursa', 'standart', 'plenty', 'stable', true, true),
  
  ('Fasulye (Taze)', 'fasulye-taze', 'Taze yeşil fasulye.', 'sebzeler', 'kg', 35.00, 
   ARRAY['https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?w=400&h=400&fit=crop'], 'Antalya', 'premium', 'limited', 'up', true, true),
  
  ('Bezelye (Taze)', 'bezelye-taze', 'Taze bezelye.', 'sebzeler', 'kg', 42.00, 
   ARRAY['https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=400&h=400&fit=crop'], 'Bursa', 'premium', 'limited', 'stable', false, true),
  
  ('Lahana', 'lahana', 'Taze beyaz lahana.', 'sebzeler', 'kg', 8.00, 
   ARRAY['https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400&h=400&fit=crop'], 'Yalova', 'standart', 'plenty', 'stable', false, true),
  
  ('Brokoli', 'brokoli', 'Taze brokoli.', 'sebzeler', 'kg', 28.00, 
   ARRAY['https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=400&fit=crop'], 'Antalya', 'premium', 'plenty', 'stable', true, true),
  
  ('Karnabahar', 'karnabahar', 'Taze karnabahar.', 'sebzeler', 'kg', 22.00, 
   ARRAY['https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=400&h=400&fit=crop'], 'Bursa', 'standart', 'plenty', 'stable', false, true),

-- Yeşillikler
  ('Maydanoz', 'maydanoz', 'Taze maydanoz demetleri.', 'yesillikler', 'demet', 8.00, 
   ARRAY['https://images.unsplash.com/photo-1506073881649-4e23be3e9ed0?w=400&h=400&fit=crop'], 'İstanbul', 'premium', 'plenty', 'stable', true, true),
  
  ('Dereotu', 'dereotu', 'Taze dereotu demetleri.', 'yesillikler', 'demet', 10.00, 
   ARRAY['https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&h=400&fit=crop'], 'İstanbul', 'premium', 'limited', 'up', false, true),
  
  ('Nane', 'nane', 'Taze nane demetleri.', 'yesillikler', 'demet', 8.00, 
   ARRAY['https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=400&h=400&fit=crop'], 'İzmir', 'premium', 'plenty', 'stable', true, true),
  
  ('Fesleğen', 'feslegen', 'Aromalık taze fesleğen.', 'yesillikler', 'demet', 12.00, 
   ARRAY['https://images.unsplash.com/photo-1600411833196-7c1f6b1a8b90?w=400&h=400&fit=crop'], 'Antalya', 'premium', 'limited', 'stable', false, true),
  
  ('Roka', 'roka', 'Taze roka demetleri.', 'yesillikler', 'demet', 10.00, 
   ARRAY['https://images.unsplash.com/photo-1574282893982-ff1675ba4900?w=400&h=400&fit=crop'], 'İstanbul', 'premium', 'plenty', 'stable', true, true),
  
  ('Marul', 'marul', 'Taze marul.', 'yesillikler', 'adet', 12.00, 
   ARRAY['https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400&h=400&fit=crop'], 'Antalya', 'premium', 'plenty', 'stable', true, true),
  
  ('Ispanak', 'ispanak', 'Taze ıspanak.', 'yesillikler', 'kg', 25.00, 
   ARRAY['https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=400&fit=crop'], 'Bursa', 'premium', 'plenty', 'stable', true, true),

-- Narenciye
  ('Portakal', 'portakal', 'Mersin''in tatlı portakalları.', 'narenciye', 'kg', 16.00, 
   ARRAY['https://images.unsplash.com/photo-1547514701-42782101795e?w=400&h=400&fit=crop'], 'Mersin', 'premium', 'plenty', 'down', true, true),
  
  ('Limon', 'limon', 'Adana''nın ekşi limonları.', 'narenciye', 'kg', 28.00, 
   ARRAY['https://images.unsplash.com/photo-1590502593747-42a996133562?w=400&h=400&fit=crop'], 'Adana', 'standart', 'plenty', 'stable', false, true),
  
  ('Mandalina', 'mandalina', 'Tatlı mandalinalar.', 'narenciye', 'kg', 18.00, 
   ARRAY['https://images.unsplash.com/photo-1611080626919-7cf5a9dbab12?w=400&h=400&fit=crop'], 'Mersin', 'premium', 'plenty', 'stable', true, true),
  
  ('Greyfurt', 'greyfurt', 'Ekşi-tatlı greyfurtlar.', 'narenciye', 'kg', 22.00, 
   ARRAY['https://images.unsplash.com/photo-1577234286642-fc512a5f8f11?w=400&h=400&fit=crop'], 'Antalya', 'standart', 'plenty', 'stable', false, true),

-- Kök Sebzeler
  ('Havuç', 'havuc', 'Konya''nın tatlı havuçları.', 'kok-sebzeler', 'kg', 12.00, 
   ARRAY['https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&h=400&fit=crop'], 'Konya', 'premium', 'plenty', 'stable', false, true),
  
  ('Patates', 'patates', 'Niğde''nin meşhur patatesleri.', 'kok-sebzeler', 'kg', 14.00, 
   ARRAY['https://images.unsplash.com/photo-1518977676601-b53f82ade05d?w=400&h=400&fit=crop'], 'Niğde', 'standart', 'plenty', 'down', true, true),
  
  ('Soğan', 'sogan', 'Kuru soğan.', 'kok-sebzeler', 'kg', 10.00, 
   ARRAY['https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&h=400&fit=crop'], 'Ankara', 'standart', 'plenty', 'stable', true, true),
  
  ('Sarımsak', 'sarimsak', 'Taze sarımsak.', 'kok-sebzeler', 'kg', 55.00, 
   ARRAY['https://images.unsplash.com/photo-1540148426945-6cf22a6b2f85?w=400&h=400&fit=crop'], 'Kastamonu', 'premium', 'limited', 'up', false, true),
  
  ('Kereviz', 'kereviz', 'Taze kereviz.', 'kok-sebzeler', 'kg', 18.00, 
   ARRAY['https://images.unsplash.com/photo-1580391564590-aeca65c5e2d3?w=400&h=400&fit=crop'], 'Konya', 'standart', 'plenty', 'stable', false, true),
  
  ('Turp', 'turp', 'Kırmızı turp.', 'kok-sebzeler', 'demet', 8.00, 
   ARRAY['https://images.unsplash.com/photo-1585564297736-b15a4f4c00d3?w=400&h=400&fit=crop'], 'Antalya', 'premium', 'plenty', 'stable', true, true),

-- Tropikal
  ('Avokado', 'avokado', 'Alanya''nın tropikal avokadoları.', 'tropikal', 'adet', 95.00, 
   ARRAY['https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&h=400&fit=crop'], 'Alanya', 'premium', 'limited', 'up', true, true),
  
  ('Mango', 'mango', 'Antalya''nın tropikal mangoları.', 'tropikal', 'adet', 120.00, 
   ARRAY['https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400&h=400&fit=crop'], 'Antalya', 'premium', 'last', 'stable', false, true),
  
  ('Ananas', 'ananas', 'Taze ananas.', 'tropikal', 'adet', 65.00, 
   ARRAY['https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&h=400&fit=crop'], 'Mersin', 'premium', 'limited', 'stable', true, true),
  
  ('Kivi', 'kivi', 'Taze kivi.', 'tropikal', 'kg', 42.00, 
   ARRAY['https://images.unsplash.com/photo-1585059895524-72359e06133a?w=400&h=400&fit=crop'], 'Yalova', 'premium', 'plenty', 'stable', true, true),
  
  ('Nar', 'nar', 'Side narları.', 'tropikal', 'kg', 35.00, 
   ARRAY['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&h=400&fit=crop'], 'Antalya', 'premium', 'plenty', 'down', true, true)

ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- BÖLÜM 3: BÖLGE-ÜRÜN FİYATLARI (REGION_PRODUCTS)
-- ============================================================================

-- Menemen bölgesi için tüm ürünleri ekle
INSERT INTO public.region_products (region_id, product_id, price, stock, quality_grade, availability_status, price_change, is_available)
SELECT 
  r.id,
  p.id,
  p.base_price * 1.0,
  100 + floor(random() * 400)::int,
  p.quality,
  p.availability,
  p.price_change,
  true
FROM public.products p
CROSS JOIN public.regions r
WHERE r.slug = 'menemen'
ON CONFLICT (region_id, product_id) DO NOTHING;

-- Aliağa bölgesi
INSERT INTO public.region_products (region_id, product_id, price, stock, quality_grade, availability_status, price_change, is_available)
SELECT 
  r.id,
  p.id,
  p.base_price * 1.05,
  80 + floor(random() * 300)::int,
  p.quality,
  p.availability,
  p.price_change,
  true
FROM public.products p
CROSS JOIN public.regions r
WHERE r.slug = 'aliaga'
ON CONFLICT (region_id, product_id) DO NOTHING;

-- Foça bölgesi
INSERT INTO public.region_products (region_id, product_id, price, stock, quality_grade, availability_status, price_change, is_available)
SELECT 
  r.id,
  p.id,
  p.base_price * 1.10,
  50 + floor(random() * 200)::int,
  p.quality,
  p.availability,
  p.price_change,
  true
FROM public.products p
CROSS JOIN public.regions r
WHERE r.slug = 'foca'
ON CONFLICT (region_id, product_id) DO NOTHING;

-- Bergama bölgesi
INSERT INTO public.region_products (region_id, product_id, price, stock, quality_grade, availability_status, price_change, is_available)
SELECT 
  r.id,
  p.id,
  p.base_price * 1.08,
  60 + floor(random() * 250)::int,
  p.quality,
  p.availability,
  p.price_change,
  true
FROM public.products p
CROSS JOIN public.regions r
WHERE r.slug = 'bergama'
ON CONFLICT (region_id, product_id) DO NOTHING;

-- Dikili bölgesi
INSERT INTO public.region_products (region_id, product_id, price, stock, quality_grade, availability_status, price_change, is_available)
SELECT 
  r.id,
  p.id,
  p.base_price * 1.12,
  40 + floor(random() * 180)::int,
  p.quality,
  p.availability,
  p.price_change,
  true
FROM public.products p
CROSS JOIN public.regions r
WHERE r.slug = 'dikili'
ON CONFLICT (region_id, product_id) DO NOTHING;

-- ============================================================================
-- SEED DATA TAMAMLANDI
-- ============================================================================
-- 
-- Eklenen veriler:
-- - 5 Bölge (Menemen, Aliağa, Foça, Bergama, Dikili)
-- - 39 Ürün (Meyveler, Sebzeler, Yeşillikler, Narenciye, Kök Sebzeler, Tropikal)
-- - Tüm bölgeler için bölge-ürün fiyatları
--
-- Admin kullanıcı oluşturmak için:
-- 1. Uygulamada normal kayıt ol
-- 2. Aşağıdaki SQL'i email adresinle çalıştır:
--
-- SELECT id FROM auth.users WHERE email = 'admin@example.com';
-- INSERT INTO public.user_roles (user_id, role) VALUES ('USER_UUID', 'superadmin');
--
-- ============================================================================
