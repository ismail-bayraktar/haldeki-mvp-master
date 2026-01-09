-- ============================================================================
-- HALDEKI.COM - PRODUCTS TABLE FIX
-- ============================================================================
-- Bu dosya mevcut products tablosunu düzeltir.
-- Eğer tablo zaten oluşturulduysa ve hatalı ise bunu çalıştırın.
-- 
-- Tarih: 2025-12-26
-- ============================================================================

-- Önce mevcut verileri sil (varsa)
TRUNCATE public.region_products CASCADE;
TRUNCATE public.products CASCADE;

-- Mevcut products tablosunu sil
DROP TABLE IF EXISTS public.products CASCADE;

-- Yeni products tablosunu oluştur (doğru şemayla)
CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    category text NOT NULL,
    unit public.product_unit DEFAULT 'kg'::public.product_unit NOT NULL,
    base_price numeric(10,2) NOT NULL,
    images text[] DEFAULT '{}'::text[],
    origin text DEFAULT 'Türkiye',
    quality public.quality_grade DEFAULT 'standart'::public.quality_grade,
    availability public.availability_status DEFAULT 'plenty'::public.availability_status,
    price_change public.price_change DEFAULT 'stable'::public.price_change,
    previous_price numeric(10,2),
    arrival_date date DEFAULT CURRENT_DATE,
    is_bugun_halde boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Index'leri oluştur
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_bugun_halde ON public.products(is_bugun_halde);

-- RLS'i etkinleştir
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" ON public.products 
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Trigger
DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Yorum
COMMENT ON TABLE public.products IS 'Ana ürün kataloğu';

-- ============================================================================
-- ŞİMDİ seed-data.sql DOSYASINI ÇALIŞTIRIN
-- ============================================================================

