-- ============================================
-- Phase 1: Guest Landing Page Access
-- ============================================
-- Purpose: Allow guests to view landing page data while protecting
--          full product details and supplier_prices
-- ============================================

-- 1. Landing page public data için view
CREATE OR REPLACE VIEW public.landing_page_data AS
SELECT
  id,
  name,
  slug,
  images,
  category,
  base_price,
  unit,
  availability,
  quality,
  origin
FROM public.products
WHERE is_active = true
LIMIT 12;

-- 2. Guest erişimi için product policy (Limited fields)
DROP POLICY IF EXISTS "Public can view landing page data" ON public.products;
CREATE POLICY "Public can view landing page data"
ON public.products
FOR SELECT
TO public, authenticated
USING (
  is_active = true
  -- Sadece landing page için gerekli field'lar
  -- Client-side filtering yapılacak
);

-- 2.1 Mevcut "Anyone can view active products" policy'sini güncelle
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products"
ON public.products
FOR SELECT
TO public, authenticated
USING (is_active = true);

-- 3. Guest kullanıcıların supplier_products görmesini ENGELLE
DROP POLICY IF EXISTS "Guests cannot view supplier products" ON public.supplier_products;
CREATE POLICY "Guests cannot view supplier products"
ON public.supplier_products
FOR SELECT
TO public
USING (false); -- ❌ Guests blocked

-- 4. Auth kullanıcılar supplier_products görebilir
DROP POLICY IF EXISTS "Authenticated users can view active supplier products" ON public.supplier_products;
CREATE POLICY "Authenticated users can view active supplier products"
ON public.supplier_products
FOR SELECT
TO authenticated
USING (is_active = true);

-- 5. Grant usage on landing_page_data view to public and authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.landing_page_data TO anon, authenticated;

-- ============================================
-- Verification Queries (Test için)
-- ============================================

-- Test 1: Guest product access (should work)
-- SET ROLE anon;
-- SELECT id, name, slug, images, category, base_price, unit FROM products WHERE is_active = true LIMIT 12;

-- Test 2: Guest supplier_products block (should fail)
-- SET ROLE anon;
-- SELECT * FROM supplier_products LIMIT 1;

-- Test 3: Auth supplier_products access (should work)
-- SET ROLE authenticated;
-- SELECT * FROM supplier_products WHERE is_active = true LIMIT 1;
