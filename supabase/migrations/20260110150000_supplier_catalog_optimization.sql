-- ============================================================================
-- Migration: Supplier Product Catalog Optimization
-- Date: 2026-01-10
-- Description: Tedarikçi ürün katalog optimizasyonu - Efficient query, upsert, index
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. COMPOSITE INDEX for efficient lookups
-- ----------------------------------------------------------------------------
-- Mevcut indexes kontrolü ve optimize edilmiş composite index
-- Bu index, supplier_id + product_id lookup'ları için kritik

-- Drop varsa yeniden oluştur (daha optimal composite index için)
DROP INDEX IF EXISTS public.idx_supplier_products_supplier_product;

CREATE INDEX CONCURRENTLY idx_supplier_products_supplier_product
  ON public.supplier_products(supplier_id, product_id, is_active)
  WHERE is_active = true;

COMMENT ON INDEX public.idx_supplier_products_supplier_product IS
  'Composite index for efficient supplier-product lookups with active filter';

-- ----------------------------------------------------------------------------
-- 2. RPC FUNCTION: get_supplier_product_catalog
-- ----------------------------------------------------------------------------
-- Tüm ürünleri + tedarikçinin fiyatını çeken efficient query
-- Pagination desteği ile
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_supplier_product_catalog(
  p_supplier_id UUID,
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 50,
  p_category TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_only_active BOOLEAN DEFAULT true
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  product_category TEXT,
  product_unit TEXT,
  product_image TEXT,

  -- Tedarikçiye özel fiyatlar
  supplier_price NUMERIC,
  supplier_previous_price NUMERIC,
  supplier_stock_quantity INTEGER,
  supplier_availability public.availability_status,

  -- Tedarikçi ürünü durumu
  has_supplier_product BOOLEAN,
  is_supplier_product_active BOOLEAN,
  supplier_product_id UUID,

  -- Meta
  total_items BIGINT,
  current_page INT,
  pages_count INT
) AS $$
DECLARE
  v_total BIGINT;
  v_offset INT;
BEGIN
  -- Offset hesapla
  v_offset := (p_page - 1) * p_page_size;

  -- Toplam kayıt sayısı (pagination için)
  SELECT COUNT(DISTINCT p.id) INTO v_total
  FROM public.products p
  LEFT JOIN public.supplier_products sp
    ON sp.product_id = p.id
    AND sp.supplier_id = p_supplier_id
  WHERE (p_category IS NULL OR p.category = p_category)
    AND (p_search IS NULL OR p.name ILIKE '%' || p_search || '%')
    AND (NOT p_only_active OR p.is_active = true);

  -- Main query - Efficient LEFT JOIN ile tüm ürünleri + tedarikçi fiyatlarını getir
  RETURN QUERY
  SELECT
    p.id as product_id,
    p.name as product_name,
    p.category as product_category,
    p.unit as product_unit,
    (p.images->>0) as product_image,

    -- Tedarikçiye özel fiyatlar (NULL ise ürün katalogda yok)
    sp.price as supplier_price,
    sp.previous_price as supplier_previous_price,
    sp.stock_quantity as supplier_stock_quantity,
    sp.availability as supplier_availability,

    -- Tedarikçi ürünü durumu
    (sp.id IS NOT NULL) as has_supplier_product,
    COALESCE(sp.is_active, false) as is_supplier_product_active,
    sp.id as supplier_product_id,

    -- Pagination meta
    v_total as total_items,
    p_page as current_page,
    CEIL(v_total::FLOAT / p_page_size)::INT as pages_count

  FROM public.products p
  LEFT JOIN public.supplier_products sp
    ON sp.product_id = p.id
    AND sp.supplier_id = p_supplier_id
    AND (NOT p_only_active OR sp.is_active = true)

  WHERE (p_category IS NULL OR p.category = p_category)
    AND (p_search IS NULL OR p.name ILIKE '%' || p_search || '%')
    AND (NOT p_only_active OR p.is_active = true)

  ORDER BY
    -- Önce tedarikçinin ürünleri (has_supplier_product = true)
    (sp.id IS NOT NULL) DESC,
    -- Sonra kategori
    p.category ASC,
    -- Sonunda isme göre
    p.name ASC

  LIMIT p_page_size OFFSET v_offset;

END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Execute yetkisi
GRANT EXECUTE ON FUNCTION get_supplier_product_catalog TO authenticated;

COMMENT ON FUNCTION get_supplier_product_catalog IS
  'Tüm ürün kataloğunu + tedarikçi özel fiyatlarını getirir. Pagination destekler.';

-- ----------------------------------------------------------------------------
-- 3. RPC FUNCTION: upsert_supplier_product_price
-- ----------------------------------------------------------------------------
-- Tedarikçi fiyat girdiğinde atomik upsert işlemi
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION upsert_supplier_product_price(
  p_supplier_id UUID,
  p_product_id UUID,
  p_price NUMERIC,
  p_stock_quantity INTEGER DEFAULT NULL,
  p_availability public.availability_status DEFAULT 'plenty',
  p_min_order_quantity INTEGER DEFAULT NULL,
  p_delivery_days INTEGER DEFAULT NULL,
  p_supplier_sku TEXT DEFAULT NULL,
  p_quality public.quality_grade DEFAULT 'standart'
)
RETURNS JSONB AS $$
DECLARE
  v_existing_id UUID;
  v_is_insert BOOLEAN;
  v_result JSONB;
BEGIN
  -- Mevcut kaydı kontrol et
  SELECT id INTO v_existing_id
  FROM public.supplier_products
  WHERE supplier_id = p_supplier_id
    AND product_id = p_product_id
  FOR UPDATE; -- Lock for concurrent safety

  v_is_insert := (v_existing_id IS NULL);

  IF v_is_insert THEN
    -- INSERT: Yeni tedarikçi ürünü
    INSERT INTO public.supplier_products (
      supplier_id,
      product_id,
      price,
      stock_quantity,
      availability,
      min_order_quantity,
      delivery_days,
      supplier_sku,
      quality,
      is_active,
      previous_price
    ) VALUES (
      p_supplier_id,
      p_product_id,
      p_price,
      COALESCE(p_stock_quantity, 0),
      p_availability,
      COALESCE(p_min_order_quantity, 1),
      COALESCE(p_delivery_days, 1),
      p_supplier_sku,
      p_quality,
      true,
      NULL -- Yeni kayıt için previous_price null
    )
    RETURNING id INTO v_existing_id;
  ELSE
    -- UPDATE: Mevcut kaydı güncelle
    UPDATE public.supplier_products
    SET
      price = p_price,
      stock_quantity = COALESCE(p_stock_quantity, stock_quantity),
      availability = p_availability,
      min_order_quantity = COALESCE(p_min_order_quantity, min_order_quantity),
      delivery_days = COALESCE(p_delivery_days, delivery_days),
      supplier_sku = COALESCE(p_supplier_sku, supplier_sku),
      quality = COALESCE(p_quality, quality),
      is_active = true -- Re-activate if was inactive
    WHERE id = v_existing_id;
  END IF;

  -- Result JSON
  SELECT jsonb_build_object(
    'success', true,
    'is_insert', v_is_insert,
    'supplier_product_id', v_existing_id,
    'supplier_id', p_supplier_id,
    'product_id', p_product_id,
    'price', p_price,
    'message', CASE
      WHEN v_is_insert THEN 'Yeni tedarikçi ürünü oluşturuldu'
      ELSE 'Mevcut tedarikçi ürünü güncellendi'
    END
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN FOREIGN_KEY_VIOLATION THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Geçersiz supplier_id veya product_id',
      'code', 'FK_VIOLATION'
    );

  WHEN CHECK_VIOLATION THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Geçersiz değer (price > 0, stock_quantity >= 0)',
      'code', 'CHECK_VIOLATION'
    );

  WHEN UNIQUE_VIOLATION THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Bu ürün için tedarikçi kaydı zaten var',
      'code', 'UNIQUE_VIOLATION'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute yetkisi
GRANT EXECUTE ON FUNCTION upsert_supplier_product_price TO authenticated;

COMMENT ON FUNCTION upsert_supplier_product_price IS
  'Tedarikçi ürün fiyatı için atomik upert işlemi. Mevcut kayıt varsa update, yoksa insert.';

-- ----------------------------------------------------------------------------
-- 4. HELPER FUNCTION: get_supplier_product_stats
-- ----------------------------------------------------------------------------
-- Tedarikçinin ürün istatistiklerini getir (dashboard için)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_supplier_product_stats(
  p_supplier_id UUID
)
RETURNS TABLE (
  stat_name TEXT,
  stat_value BIGINT
) AS $$
BEGIN
  -- Toplam ürün sayısı (aktif)
  RETURN QUERY
  SELECT
    'total_products'::TEXT,
    COUNT(*)::BIGINT
  FROM public.supplier_products
  WHERE supplier_id = p_supplier_id AND is_active = true

  UNION ALL

  -- Stokta olan ürünler
  SELECT
    'in_stock'::TEXT,
    COUNT(*)::BIGINT
  FROM public.supplier_products
  WHERE supplier_id = p_supplier_id
    AND is_active = true
    AND stock_quantity > 0

  UNION ALL

  -- Stok tükenmiş ürünler
  SELECT
    'out_of_stock'::TEXT,
    COUNT(*)::BIGINT
  FROM public.supplier_products
  WHERE supplier_id = p_supplier_id
    AND is_active = true
    AND stock_quantity = 0

  UNION ALL

  -- Fiyatı artan ürünler (son değişiklik)
  SELECT
    'price_increased'::TEXT,
    COUNT(*)::BIGINT
  FROM public.supplier_products
  WHERE supplier_id = p_supplier_id
    AND price_change = 'increased'

  UNION ALL

  -- Fiyatı azalan ürünler
  SELECT
    'price_decreased'::TEXT,
    COUNT(*)::BIGINT
  FROM public.supplier_products
  WHERE supplier_id = p_supplier_id
    AND price_change = 'decreased';

END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_supplier_product_stats TO authenticated;

COMMENT ON FUNCTION get_supplier_product_stats IS
  'Tedarikçi ürün istatistikleri - Toplam, stok durumu, fiyat değişiklikleri';

-- ----------------------------------------------------------------------------
-- 5. BATCH OPERATIONS
-- ----------------------------------------------------------------------------
-- Toplu fiyat güncelleme için batch upsert
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION batch_upsert_supplier_prices(
  p_supplier_id UUID,
  p_products JSONB -- Array of {product_id, price, stock_quantity, ...}
)
RETURNS TABLE (
  product_id UUID,
  success BOOLEAN,
  message TEXT,
  supplier_product_id UUID
) AS $$
DECLARE
  v_product JSONB;
  v_result JSONB;
BEGIN
  -- Her ürün için upsert
  FOR v_product IN SELECT * FROM jsonb_array_elements(p_products)
  LOOP
    v_result := upsert_supplier_product_price(
      p_supplier_id,
      (v_product->>'product_id')::UUID,
      (v_product->>'price')::NUMERIC,
      COALESCE((v_product->>'stock_quantity')::INT, NULL),
      COALESCE((v_product->>'availability')::public.availability_status, 'plenty'),
      COALESCE((v_product->>'min_order_quantity')::INT, NULL),
      COALESCE((v_product->>'delivery_days')::INT, NULL),
      v_product->>'supplier_sku',
      COALESCE((v_product->>'quality')::public.quality_grade, 'standart')
    );

    RETURN QUERY SELECT
      (v_product->>'product_id')::UUID,
      (v_result->>'success')::BOOLEAN,
      v_result->>'message',
      (v_result->>'supplier_product_id')::UUID;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION batch_upsert_supplier_prices TO authenticated;

COMMENT ON FUNCTION batch_upsert_supplier_prices IS
  'Toplu tedarikçi fiyat güncellemesi için batch upsert işlemi';

-- ----------------------------------------------------------------------------
-- MIGRATION METADATA
-- ----------------------------------------------------------------------------

INSERT INTO public.schema_migrations (
  migration_name,
  description,
  applied_at
) VALUES (
  'supplier_catalog_optimization',
  'Tedarikçi ürün katalog optimizasyonu - Efficient query, upsert, batch operations',
  NOW()
) ON CONFLICT (migration_name) DO NOTHING;

-- ============================================================================
-- SON
-- ============================================================================
