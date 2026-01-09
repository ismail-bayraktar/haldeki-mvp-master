-- Phase 12: Complete Test Data Creation (Fixed)
-- Date: 2025-01-10

-- ============================================================================
-- INSERT COMPREHENSIVE TEST DATA
-- ============================================================================

-- 1. Add variations to existing products
INSERT INTO public.product_variations (product_id, variation_type, variation_value, display_order, metadata)
SELECT
  id,
  'size',
  '1 KG',
  1,
  '{"value": "1", "unit": "KG"}'::jsonb
FROM public.products
WHERE id IS NOT NULL
LIMIT 10
ON CONFLICT (product_id, variation_type, variation_value) DO NOTHING;

-- 2. Add type variations for some products
INSERT INTO public.product_variations (product_id, variation_type, variation_value, display_order, metadata)
SELECT
  id,
  'type',
  'BEYAZ',
  2,
  '{"color": "white"}'::jsonb
FROM public.products
WHERE id IS NOT NULL
LIMIT 5
ON CONFLICT (product_id, variation_type, variation_value) DO NOTHING;

-- 3. Add supplier products for existing supplier
DO $$
DECLARE
  v_supplier_id UUID;
  v_product_count INTEGER := 0;
BEGIN
  -- Get first supplier
  SELECT id INTO v_supplier_id FROM public.suppliers LIMIT 1;

  IF v_supplier_id IS NULL THEN
    RAISE NOTICE 'No suppliers found. Skipping test data.';
    RETURN;
  END IF;

  -- Add supplier products for 10 products with correct defaults
  INSERT INTO public.supplier_products (
    supplier_id,
    product_id,
    price,
    stock_quantity,
    availability,
    is_active,
    is_featured,
    quality,
    delivery_days
  )
  SELECT
    v_supplier_id,
    id,
    (random() * 100 + 20)::numeric(10,2),
    floor(random() * 100 + 10),
    CASE
      WHEN random() > 0.66 THEN 'plenty'
      WHEN random() > 0.33 THEN 'limited'
      ELSE 'last'
    END::public.availability_status,
    true,
    random() > 0.8,
    CASE
      WHEN random() > 0.7 THEN 'premium'
      WHEN random() > 0.3 THEN 'standart'
      ELSE 'ekonomik'
    END::public.quality_grade,
    floor(random() * 3 + 1)
  FROM public.products
  WHERE id IS NOT NULL
  LIMIT 10
  ON CONFLICT (supplier_id, product_id) DO UPDATE SET
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    availability = EXCLUDED.availability,
    updated_at = NOW();

  GET DIAGNOSTICS v_product_count = ROW_COUNT;
  RAISE NOTICE 'Created/updated % supplier products', v_product_count;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show summary
SELECT '=== TEST DATA SUMMARY ===' as info;

SELECT
  'supplier_products' as table_name,
  COUNT(*) as total_rows,
  COUNT(*) FILTER (WHERE is_active = true) as active_rows
FROM public.supplier_products

UNION ALL

SELECT
  'product_variations',
  COUNT(*),
  NULL::BIGINT
FROM public.product_variations;

-- Show sample data from bugun_halde_comparison
SELECT '=== BUGUN HALDE SAMPLE (first 5) ===' as info;
SELECT
  product_name,
  supplier_name,
  price,
  availability,
  market_min_price,
  market_max_price,
  total_suppliers,
  is_lowest_price
FROM public.bugun_halde_comparison
LIMIT 5;

-- Show products with multiple suppliers (if any)
SELECT '=== PRODUCTS WITH MULTIPLE SUPPLIERS ===' as info;
SELECT
  product_name,
  supplier_count,
  min_price,
  max_price,
  avg_price
FROM (
  SELECT
    product_id,
    product_name,
    COUNT(*) as supplier_count,
    MIN(price) as min_price,
    MAX(price) as max_price,
    ROUND(AVG(price)::numeric, 2) as avg_price
  FROM public.bugun_halde_comparison
  GROUP BY product_id, product_name
  HAVING COUNT(*) > 1
  ORDER BY supplier_count DESC
) sub
LIMIT 5;

-- Show variation statistics
SELECT '=== VARIATION STATISTICS ===' as info;
SELECT
  variation_type,
  COUNT(DISTINCT variation_value) as unique_values,
  COUNT(*) as total_variations
FROM public.product_variations
GROUP BY variation_type
ORDER BY variation_type;
