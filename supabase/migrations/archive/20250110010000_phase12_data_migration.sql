-- Phase 12: Data Migration from Current Schema to Multi-Supplier
-- Date: 2025-01-10
-- Purpose: Migrate existing products to supplier_products junction table
-- Strategy: Preserve existing data while establishing multi-supplier foundation

-- ============================================================================
-- MIGRATION STRATEGY
-- ============================================================================
-- 1. Identify products with existing supplier_id (from Phase 9)
-- 2. Create supplier_products records for each product-supplier pair
-- 3. Preserve pricing and inventory data
-- 4. Set reasonable defaults for new fields
-- 5. Update region_products to reference base product (no change needed)

-- ============================================================================
-- STEP 1: Migrate existing products with supplier_id
-- ============================================================================

-- Insert into supplier_products from existing products that have supplier_id
INSERT INTO public.supplier_products (
  supplier_id,
  product_id,
  price,
  previous_price,
  price_change,
  stock_quantity,
  availability,
  is_active,
  quality,
  origin,
  min_order_quantity,
  delivery_days,
  created_at,
  updated_at,
  last_price_update
)
SELECT
  p.supplier_id,
  p.id,
  COALESCE(p.price, 0) as price,
  p.previous_price,
  COALESCE(p.price_change, 'stable') as price_change,
  COALESCE(p.stock, 0) as stock_quantity,
  COALESCE(p.availability, 'plenty') as availability,
  (p.product_status IS NULL OR p.product_status != 'inactive') as is_active,
  COALESCE(p.quality, 'standart') as quality,
  COALESCE(p.origin, 'Türkiye') as origin,
  1 as min_order_quantity,
  1 as delivery_days,
  p.created_at,
  p.updated_at,
  CASE
    WHEN p.previous_price IS NOT NULL THEN p.updated_at
    ELSE NULL
  END as last_price_update
FROM public.products p
WHERE p.supplier_id IS NOT NULL
  AND p.price IS NOT NULL
  AND p.price > 0  -- Critical: Only migrate products with valid prices
ON CONFLICT (supplier_id, product_id) DO NOTHING;

-- Log migration results
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count
  FROM public.supplier_products;

  RAISE NOTICE 'Migrated % products to supplier_products junction table', migrated_count;
END $$;

-- ============================================================================
-- STEP 2: Identify products without supplier_id (orphan products)
-- ============================================================================

-- Create a log of products that need supplier assignment
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM public.products p
  WHERE p.supplier_id IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.supplier_products sp
      WHERE sp.product_id = p.id
    );

  IF orphan_count > 0 THEN
    RAISE NOTICE 'Found % products without supplier assignment', orphan_count;
    RAISE NOTICE 'These products need manual supplier assignment or should be marked as inactive';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: VARIATION EXTRACTION DISABLED
-- ============================================================================
-- Variations will be created from Excel seed data in seed-data/
-- This avoids CASE/regexp_matches function errors

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== MULTI-SUPPLIER PRODUCT MIGRATION COMPLETE ===';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Review orphan products (products without supplier assignment)';
  RAISE NOTICE '2. Assign suppliers to orphan products or mark as inactive';
  RAISE NOTICE '3. Create variations from Excel seed data';
  RAISE NOTICE '4. Test bugun_halde_comparison view for price comparison';
  RAISE NOTICE '5. Update frontend to use supplier_products junction table';
END $$;
