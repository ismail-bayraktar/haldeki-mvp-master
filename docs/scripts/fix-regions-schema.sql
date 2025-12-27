-- ============================================================================
-- HALDEKI.COM - REGIONS TABLE FIX
-- ============================================================================
-- Bu dosya regions tablosuna eksik kolonları ekler.
-- SQL Editor'da çalıştırın.
-- 
-- Tarih: 2025-12-26
-- ============================================================================

-- Eksik kolonları ekle
ALTER TABLE public.regions 
ADD COLUMN IF NOT EXISTS districts text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS min_order_amount numeric(10,2) DEFAULT 100,
ADD COLUMN IF NOT EXISTS delivery_fee numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS free_delivery_threshold numeric(10,2) DEFAULT 200;

-- Mevcut bölgeleri güncelle
UPDATE public.regions SET
  min_order_amount = 100,
  delivery_fee = 0,
  free_delivery_threshold = 200,
  districts = '{}'
WHERE min_order_amount IS NULL;

-- Menemen için örnek mahalleler
UPDATE public.regions SET
  districts = ARRAY['Merkez', 'Ulukent', 'Seyrek', 'Emiralem', 'Villakent', 'Türkelli'],
  min_order_amount = 100,
  delivery_fee = 0,
  free_delivery_threshold = 150
WHERE slug = 'menemen';

-- Aliağa için örnek mahalleler
UPDATE public.regions SET
  districts = ARRAY['Merkez', 'Çaltılıdere', 'Yeni Şakran', 'Helvacı', 'Samurlu'],
  min_order_amount = 120,
  delivery_fee = 10,
  free_delivery_threshold = 200
WHERE slug = 'aliaga';

-- Foça için örnek mahalleler
UPDATE public.regions SET
  districts = ARRAY['Merkez', 'Yenifoça', 'Kozbeyli', 'Gerenköy'],
  min_order_amount = 150,
  delivery_fee = 15,
  free_delivery_threshold = 250
WHERE slug = 'foca';

-- Bergama için örnek mahalleler
UPDATE public.regions SET
  districts = ARRAY['Merkez', 'Dikili Yolu', 'İzmir Yolu'],
  min_order_amount = 150,
  delivery_fee = 20,
  free_delivery_threshold = 300
WHERE slug = 'bergama';

-- Dikili için örnek mahalleler
UPDATE public.regions SET
  districts = ARRAY['Merkez', 'Çandarlı', 'Bademli', 'Salihleraltı'],
  min_order_amount = 180,
  delivery_fee = 25,
  free_delivery_threshold = 300
WHERE slug = 'dikili';

-- ============================================================================
-- KONTROL
-- ============================================================================
-- SELECT name, slug, districts, min_order_amount, delivery_fee FROM public.regions;

