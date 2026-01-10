-- ============================================================================
-- Migration: Supplier Product Catalog Security Fix
-- Date: 2026-01-10
-- Description: Authorization bypass ve input validation fix'leri
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DROP OLD FUNCTIONS (Security fix için recreate)
-- ----------------------------------------------------------------------------

DROP FUNCTION IF EXISTS get_supplier_product_catalog(UUID, INT, INT, TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS upsert_supplier_product_price(UUID, UUID, NUMERIC, INTEGER, public.availability_status, INTEGER, INTEGER, TEXT, public.quality_grade);

-- ----------------------------------------------------------------------------
-- 2. SECURE VERSION: get_supplier_product_catalog
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_supplier_product_catalog(
  p_supplier_id UUID DEFAULT NULL,  -- NULL = kullanıcının kendi tedarikçisi
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
  supplier_price NUMERIC,
  supplier_previous_price NUMERIC,
  supplier_stock_quantity INTEGER,
  supplier_availability public.availability_status,
  has_supplier_product BOOLEAN,
  is_supplier_product_active BOOLEAN,
  supplier_product_id UUID,
  total_items BIGINT,
  current_page INT,
  pages_count INT
) AS $$
DECLARE
  v_total BIGINT;
  v_offset INT;
  v_user_supplier_id UUID;
  v_user_role TEXT;
  v_supplier_id UUID;
BEGIN
  -- 1. AUTHORIZATION CHECK - Kullanıcının rolünü ve tedarikçi ID'sini al
  SELECT
    s.id,
    COALESCE(p.role, 'customer')
  INTO v_user_supplier_id, v_user_role
  FROM public.profiles p
  LEFT JOIN public.suppliers s ON s.user_id = p.id
  WHERE p.id = auth.uid();

  -- 2. AUTHORIZATION: Sadece admin başka tedarikçinin verisini görebilir
  IF v_user_role != 'admin' THEN
    -- Normal user: Sadece kendi tedarikçisini görsün
    v_supplier_id := v_user_supplier_id;
  ELSE
    -- Admin: İstenen tedarikçi ID'sini kullan (veya NULL ise kendi)
    v_supplier_id := COALESCE(p_supplier_id, v_user_supplier_id);
  END IF;

  -- 3. VALIDATION: Sayfa numarası pozitif olmalı
  IF p_page < 1 THEN
    RAISE EXCEPTION 'Page number must be >= 1' USING ERRCODE = '22003';
  END IF;

  -- 4. VALIDATION: Page size sınırı (max 100)
  IF p_page_size < 1 OR p_page_size > 100 THEN
    RAISE EXCEPTION 'Page size must be between 1 and 100' USING ERRCODE = '22003';
  END IF;

  -- 5. OFFSET hesapla
  v_offset := (p_page - 1) * p_page_size;

  -- 6. Toplam kayıt sayısı
  SELECT COUNT(DISTINCT p.id) INTO v_total
  FROM public.products p
  LEFT JOIN public.supplier_products sp
    ON sp.product_id = p.id
    AND sp.supplier_id = v_supplier_id
  WHERE (p_category IS NULL OR p.category = p_category)
    AND (p_search IS NULL OR p.name ILIKE '%' || p_search || '%')
    AND (NOT p_only_active OR p.is_active = true);

  -- 7. Main query
  RETURN QUERY
  SELECT
    p.id as product_id,
    p.name as product_name,
    p.category as product_category,
    p.unit as product_unit,
    (p.images->>0) as product_image,
    sp.price as supplier_price,
    sp.previous_price as supplier_previous_price,
    sp.stock_quantity as supplier_stock_quantity,
    sp.availability as supplier_availability,
    (sp.id IS NOT NULL) as has_supplier_product,
    COALESCE(sp.is_active, false) as is_supplier_product_active,
    sp.id as supplier_product_id,
    v_total as total_items,
    p_page as current_page,
    CEIL(v_total::FLOAT / p_page_size)::INT as pages_count
  FROM public.products p
  LEFT JOIN public.supplier_products sp
    ON sp.product_id = p.id
    AND sp.supplier_id = v_supplier_id
    AND (NOT p_only_active OR sp.is_active = true)
  WHERE (p_category IS NULL OR p.category = p_category)
    AND (p_search IS NULL OR p.name ILIKE '%' || p_search || '%')
    AND (NOT p_only_active OR p.is_active = true)
  ORDER BY (sp.id IS NOT NULL) DESC, p.category ASC, p.name ASC
  LIMIT p_page_size OFFSET v_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER
-- SECURITY INVOKER: Caller yetkileriyle çalışır (RLS aktif)
SET search_path = public;

GRANT EXECUTE ON FUNCTION get_supplier_product_catalog TO authenticated;

COMMENT ON FUNCTION get_supplier_product_catalog IS
  'Tüm ürün kataloğunu + tedarikçi özel fiyatlarını getirir. Authorization check ile güvenli.';

-- ----------------------------------------------------------------------------
-- 3. SECURE VERSION: upsert_supplier_product_price
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION upsert_supplier_product_price(
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
  v_supplier_id UUID;
  v_existing_id UUID;
  v_is_insert BOOLEAN;
  v_result JSONB;
BEGIN
  -- 1. AUTHORIZATION: Kullanıcının tedarikçi ID'sini al
  SELECT s.id INTO v_supplier_id
  FROM public.suppliers s
  WHERE s.user_id = auth.uid()
    AND s.is_active = true;

  -- 2. AUTHORIZATION CHECK: Sadece tedarikçi fiyat girebilir
  IF v_supplier_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Bu işlem için yetkiniz yok. Sadece aktif tedarikçiler fiyat girebilir.',
      'code', 'AUTHORIZATION_ERROR'
    );
  END IF;

  -- 3. VALIDATION: Fiyat pozitif olmalı
  IF p_price <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Fiyat 0''dan büyük olmalıdır',
      'code', 'VALIDATION_ERROR',
      'field', 'price'
    );
  END IF;

  -- 4. VALIDATION: Stok negatif olamaz
  IF p_stock_quantity IS NOT NULL AND p_stock_quantity < 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Stok miktarı negatif olamaz',
      'code', 'VALIDATION_ERROR',
      'field', 'stock_quantity'
    );
  END IF;

  -- 5. VALIDATION: Product_id geçerli olmalı
  IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = p_product_id AND is_active = true) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Geçersiz ürün ID',
      'code', 'VALIDATION_ERROR',
      'field', 'product_id'
    );
  END IF;

  -- 6. UPSERT: Mevcut kaydı kontrol et
  SELECT id INTO v_existing_id
  FROM public.supplier_products
  WHERE supplier_id = v_supplier_id
    AND product_id = p_product_id
  FOR UPDATE;

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
      v_supplier_id,
      p_product_id,
      p_price,
      COALESCE(p_stock_quantity, 0),
      p_availability,
      COALESCE(p_min_order_quantity, 1),
      COALESCE(p_delivery_days, 1),
      p_supplier_sku,
      p_quality,
      true,
      NULL
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
      is_active = true,
      updated_at = NOW()
    WHERE id = v_existing_id;
  END IF;

  -- 7. SUCCESS
  RETURN jsonb_build_object(
    'success', true,
    'is_insert', v_is_insert,
    'supplier_product_id', v_existing_id,
    'supplier_id', v_supplier_id,
    'product_id', p_product_id,
    'price', p_price,
    'message', CASE
      WHEN v_is_insert THEN 'Yeni tedarikçi ürünü oluşturuldu'
      ELSE 'Mevcut tedarikçi ürünü güncellendi'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER
SET search_path = public;

GRANT EXECUTE ON FUNCTION upsert_supplier_product_price TO authenticated;

COMMENT ON FUNCTION upsert_supplier_product_price IS
  'Tedarikçi ürün fiyatı için güvenli upsert. Authorization + validation ile.';

-- ============================================================================
-- SON
-- ============================================================================
