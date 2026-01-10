-- ============================================================================
-- Pricing System Redesign - Data Migration
-- Date: 2026-01-10
-- Author: Database Architect
-- Purpose: Migrate data from old 4-layer pricing to new simplified structure
--
-- SAFE MIGRATION PROTOCOL:
-- 1. Backup existing data (already done)
-- 2. Add new columns (non-breaking)
-- 3. Migrate data with validation
-- 4. Verify integrity
-- 5. Create rollback capability
-- ============================================================================

-- ============================================================================
-- PRE-MIGRATION CHECKS
-- ============================================================================

DO $$
DECLARE
  v_products_count INTEGER;
  v_supplier_products_count INTEGER;
  v_region_products_count INTEGER;
  v_product_variations_count INTEGER;
BEGIN
  -- Count existing records
  SELECT COUNT(*) INTO v_products_count FROM public.products;
  SELECT COUNT(*) INTO v_supplier_products_count FROM public.supplier_products;
  SELECT COUNT(*) INTO v_region_products_count FROM public.region_products;
  SELECT COUNT(*) INTO v_product_variations_count FROM public.product_variations;

  RAISE NOTICE '=== PRE-MIGRATION DATA COUNT ===';
  RAISE NOTICE 'Products: %', v_products_count;
  RAISE NOTICE 'Supplier Products: %', v_supplier_products_count;
  RAISE NOTICE 'Region Products: %', v_region_products_count;
  RAISE NOTICE 'Product Variations: %', v_product_variations_count;

  -- Safety check: ensure schema migration ran first
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'pricing_config'
  ) THEN
    RAISE EXCEPTION 'Schema migration (20260110200000) must run before data migration. Please run schema migration first.';
  END IF;

  RAISE NOTICE 'Pre-migration checks passed. Proceeding with data migration...';
END $$;

-- ============================================================================
-- STEP 1: Set Regional Multipliers Based on Existing Price Data
-- ============================================================================

-- Calculate implied regional multipliers from existing region_products data
-- This preserves existing regional pricing relationships

DO $$
DECLARE
  v_region RECORD;
  v_avg_ratio NUMERIC;
  v_supplier_avg NUMERIC;
  v_region_avg NUMERIC;
BEGIN
  RAISE NOTICE '=== STEP 1: Calculating regional multipliers ===';

  -- For each region, calculate the average price ratio vs supplier prices
  FOR v_region IN
    SELECT DISTINCT rp.region_id, r.name
    FROM public.region_products rp
    INNER JOIN public.regions r ON r.id = rp.region_id
    WHERE rp.is_active = true
  LOOP
    -- Get average supplier price for products in this region
    SELECT AVG(sp.price) INTO v_supplier_avg
    FROM public.supplier_products sp
    INNER JOIN public.region_products rp ON rp.product_id = sp.product_id
    WHERE rp.region_id = v_region.region_id AND sp.is_active = true;

    -- Get average region price
    SELECT AVG(rp.price) INTO v_region_avg
    FROM public.region_products rp
    WHERE rp.region_id = v_region.region_id AND rp.is_active = true;

    -- Calculate multiplier (default to 1.00 if no data)
    v_avg_ratio := CASE
      WHEN v_supplier_avg > 0 THEN ROUND(v_region_avg / v_supplier_avg, 4)
      ELSE 1.00
    END;

    -- Update regional multiplier (clamped to reasonable range 0.8 - 1.5)
    UPDATE public.regions
    SET price_multiplier = LEAST(GREATEST(v_avg_ratio, 0.80::NUMERIC), 1.50::NUMERIC)
    WHERE id = v_region.region_id;

    RAISE NOTICE 'Region % (ID: %): multiplier set to % (from avg ratio %)',
      v_region.name,
      v_region.region_id,
      LEAST(GREATEST(v_avg_ratio, 0.80::NUMERIC), 1.50::NUMERIC),
      v_avg_ratio;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Migrate Product Base Prices to Supplier Products
-- ============================================================================

-- For supplier_products that don't have a price set, use the product.base_price
-- or fall back to product.price

DO $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  RAISE NOTICE '=== STEP 2: Migrating product base prices to supplier_products ===';

  -- Update supplier_products where price is NULL or 0
  WITH missing_prices AS (
    SELECT DISTINCT
      sp.id as supplier_product_id,
      COALESCE(p.base_price, p.price, sp.price) as new_price
    FROM public.supplier_products sp
    INNER JOIN public.products p ON p.id = sp.product_id
    WHERE (sp.price IS NULL OR sp.price = 0)
      AND (p.base_price IS NOT NULL OR p.price IS NOT NULL)
  )
  UPDATE public.supplier_products sp
  SET
    price = mp.new_price,
    previous_price = sp.price,
    updated_at = NOW()
  FROM missing_prices mp
  WHERE sp.id = mp.supplier_product_id
    AND (sp.price IS NULL OR sp.price = 0);

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % supplier_products with product base prices', v_updated_count;
END $$;

-- ============================================================================
-- STEP 3: Populate Price History with Current State
-- ============================================================================

DO $$
DECLARE
  v_config RECORD;
  v_history_count INTEGER;
BEGIN
  RAISE NOTICE '=== STEP 3: Populating price history ===';

  -- Get active config
  SELECT * INTO v_config
  FROM public.pricing_config
  WHERE is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active pricing config found. Cannot populate price history.';
  END IF;

  -- Insert current price state into history
  INSERT INTO public.price_history (
    product_id,
    supplier_id,
    region_id,
    supplier_price,
    b2b_price,
    b2c_price,
    regional_multiplier,
    commission_rate_b2b,
    commission_rate_b2c,
    calculation_mode,
    change_reason
  )
  SELECT
    sp.product_id,
    sp.supplier_id,
    r.id as region_id,
    sp.price as supplier_price,
    -- Calculate B2B price
    CASE v_config.price_calculation_mode
      WHEN 'markup' THEN ROUND(sp.price / (1 - v_config.commission_b2b) * r.price_multiplier, 2)
      ELSE ROUND(sp.price * (1 + v_config.commission_b2b) * r.price_multiplier, 2)
    END,
    -- Calculate B2C price
    CASE v_config.price_calculation_mode
      WHEN 'markup' THEN ROUND(sp.price / (1 - v_config.commission_b2c) * r.price_multiplier, 2)
      ELSE ROUND(sp.price * (1 + v_config.commission_b2c) * r.price_multiplier, 2)
    END,
    r.price_multiplier,
    v_config.commission_b2b,
    v_config.commission_b2c,
    v_config.price_calculation_mode,
    'Initial migration - current price state'
  FROM public.supplier_products sp
  INNER JOIN public.suppliers s ON s.id = sp.supplier_id
  CROSS JOIN public.regions r
  WHERE sp.is_active = true
    AND s.is_active = true
    AND r.is_active = true;

  GET DIAGNOSTICS v_history_count = ROW_COUNT;
  RAISE NOTICE 'Inserted % price history records', v_history_count;
END $$;

-- ============================================================================
-- STEP 4: Validate Migration Data Integrity
-- ============================================================================

DO $$
DECLARE
  v_orphan_products INTEGER; -- Products without any supplier
  v_orphan_regions INTEGER; -- Regions without price multiplier
  v_zero_prices INTEGER; -- Products with zero price
  v_negative_multipliers INTEGER;
BEGIN
  RAISE NOTICE '=== STEP 4: Validating data integrity ===';

  -- Check for products without active suppliers
  SELECT COUNT(DISTINCT p.id) INTO v_orphan_products
  FROM public.products p
  LEFT JOIN public.supplier_products sp ON sp.product_id = p.id AND sp.is_active = true
  WHERE (p.is_active = true OR p.product_status = 'active')
    AND sp.id IS NULL;

  IF v_orphan_products > 0 THEN
    RAISE WARNING 'Found % active products without any active supplier', v_orphan_products;
  END IF;

  -- Check for regions without price multiplier
  SELECT COUNT(*) INTO v_orphan_regions
  FROM public.regions
  WHERE is_active = true AND (price_multiplier IS NULL OR price_multiplier = 0);

  IF v_orphan_regions > 0 THEN
    RAISE EXCEPTION 'Found % active regions without valid price multiplier', v_orphan_regions;
  END IF;

  -- Check for supplier_products with zero/null prices
  SELECT COUNT(*) INTO v_zero_prices
  FROM public.supplier_products
  WHERE is_active = true AND (price IS NULL OR price <= 0);

  IF v_zero_prices > 0 THEN
    RAISE WARNING 'Found % active supplier_products with invalid prices', v_zero_prices;
  END IF;

  -- Check for negative regional multipliers
  SELECT COUNT(*) INTO v_negative_multipliers
  FROM public.regions
  WHERE price_multiplier < 0;

  IF v_negative_multipliers > 0 THEN
    RAISE EXCEPTION 'Found % regions with negative price multipliers', v_negative_multipliers;
  END IF;

  RAISE NOTICE 'Data integrity validation complete';
END $$;

-- ============================================================================
-- STEP 5: Compare Old vs New Pricing (Validation)
-- ============================================================================

-- Create temporary comparison table
CREATE TEMP TABLE IF NOT EXISTS pricing_migration_validation AS
SELECT
  p.id as product_id,
  p.name as product_name,
  r.id as region_id,
  r.name as region_name,

  -- Old pricing
  rp.price as old_region_price,
  rp.business_price as old_business_price,

  -- New pricing (using calculation function)
  new.b2b_price as new_b2b_price,
  new.b2c_price as new_b2c_price,

  -- Difference calculation
  CASE
    WHEN rp.business_price IS NOT NULL THEN
      ABS(new.b2b_price - rp.business_price) / NULLIF(rp.business_price, 0)
    ELSE NULL
  END as b2b_diff_ratio,

  CASE
    WHEN rp.price IS NOT NULL THEN
      ABS(new.b2c_price - rp.price) / NULLIF(rp.price, 0)
    ELSE NULL
  END as b2c_diff_ratio

FROM public.products p
INNER JOIN public.region_products rp ON rp.product_id = p.id
INNER JOIN public.regions r ON r.id = rp.region_id
CROSS JOIN LATERAL (
  SELECT
    CASE
      WHEN (SELECT price_calculation_mode FROM public.pricing_config WHERE is_active = true LIMIT 1) = 'markup' THEN
        ROUND(
          (SELECT sp.price FROM public.supplier_products sp
           WHERE sp.product_id = p.id AND sp.is_active = true
           ORDER BY sp.price ASC LIMIT 1) /
          (1 - (SELECT commission_b2b FROM public.pricing_config WHERE is_active = true LIMIT 1)) *
          r.price_multiplier, 2
        )
      ELSE
        ROUND(
          (SELECT sp.price FROM public.supplier_products sp
           WHERE sp.product_id = p.id AND sp.is_active = true
           ORDER BY sp.price ASC LIMIT 1) *
          (1 + (SELECT commission_b2b FROM public.pricing_config WHERE is_active = true LIMIT 1)) *
          r.price_multiplier, 2
        )
    END as b2b_price,
    CASE
      WHEN (SELECT price_calculation_mode FROM public.pricing_config WHERE is_active = true LIMIT 1) = 'markup' THEN
        ROUND(
          (SELECT sp.price FROM public.supplier_products sp
           WHERE sp.product_id = p.id AND sp.is_active = true
           ORDER BY sp.price ASC LIMIT 1) /
          (1 - (SELECT commission_b2c FROM public.pricing_config WHERE is_active = true LIMIT 1)) *
          r.price_multiplier, 2
        )
      ELSE
        ROUND(
          (SELECT sp.price FROM public.supplier_products sp
           WHERE sp.product_id = p.id AND sp.is_active = true
           ORDER BY sp.price ASC LIMIT 1) *
          (1 + (SELECT commission_b2c FROM public.pricing_config WHERE is_active = true LIMIT 1)) *
          r.price_multiplier, 2
        )
    END as b2c_price
) new
WHERE rp.is_active = true AND r.is_active = true;

-- Report validation results
DO $$
DECLARE
  v_total_comparisons INTEGER;
  v_large_diff_b2b INTEGER;
  v_large_diff_b2c INTEGER;
  v_exact_match_b2b INTEGER;
  v_exact_match_b2c INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_comparisons FROM pricing_migration_validation;

  SELECT COUNT(*) INTO v_large_diff_b2b
  FROM pricing_migration_validation
  WHERE b2b_diff_ratio > 0.10; -- More than 10% difference

  SELECT COUNT(*) INTO v_large_diff_b2c
  FROM pricing_migration_validation
  WHERE b2c_diff_ratio > 0.10;

  SELECT COUNT(*) INTO v_exact_match_b2b
  FROM pricing_migration_validation
  WHERE b2b_diff_ratio = 0 OR b2b_diff_ratio IS NULL;

  SELECT COUNT(*) INTO v_exact_match_b2c
  FROM pricing_migration_validation
  WHERE b2c_diff_ratio = 0 OR b2c_diff_ratio IS NULL;

  RAISE NOTICE '=== STEP 5: Pricing Comparison Results ===';
  RAISE NOTICE 'Total price comparisons: %', v_total_comparisons;
  RAISE NOTICE 'Exact B2B matches: % (%)', v_exact_match_b2b, ROUND(100.0 * v_exact_match_b2b / NULLIF(v_total_comparisons, 0), 2);
  RAISE NOTICE 'Exact B2C matches: % (%)', v_exact_match_b2c, ROUND(100.0 * v_exact_match_b2c / NULLIF(v_total_comparisons, 0), 2);
  RAISE NOTICE 'Large B2B differences (>10%%): %', v_large_diff_b2b;
  RAISE NOTICE 'Large B2C differences (>10%%): %', v_large_diff_b2c;

  IF v_large_diff_b2b > v_total_comparisons * 0.2 THEN
    RAISE WARNING 'More than 20%% of B2B prices have >10%% difference. Review recommended.';
  END IF;

  IF v_large_diff_b2c > v_total_comparisons * 0.2 THEN
    RAISE WARNING 'More than 20%% of B2C prices have >10%% difference. Review recommended.';
  END IF;
END $$;

-- Show sample comparison (first 10 records)
DO $$
BEGIN
  RAISE NOTICE '=== Sample Price Comparisons (First 10) ===';
  FOR i IN 1..10 LOOP
    DECLARE
      v_sample RECORD;
    BEGIN
      SELECT * INTO v_sample FROM pricing_migration_validation LIMIT 1 OFFSET i-1;
      EXIT WHEN NOT FOUND;

      RAISE NOTICE '[%] % - Region: % | Old B2B: % | New B2B: % | Diff: %%%',
        i,
        SUBSTRING(v_sample.product_name FROM 1 FOR 30),
        v_sample.region_name,
        COALESCE(v_sample.old_business_price::TEXT, 'NULL'),
        COALESCE(v_sample.new_b2b_price::TEXT, 'NULL'),
        ROUND(100.0 * COALESCE(v_sample.b2b_diff_ratio, 0), 2);
    END;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 6: Create Migration Summary Report
-- ============================================================================

DO $$
DECLARE
  v_start_time TIMESTAMPTZ := NOW();
  v_end_time TIMESTAMPTZ;
  v_duration INTERVAL;
BEGIN
  v_end_time := NOW();
  v_duration := v_end_time - v_start_time;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration Date: %', v_end_time;
  RAISE NOTICE 'Duration: % seconds', EXTRACT(EPOCH FROM v_duration);
  RAISE NOTICE '';
  RAISE NOTICE 'Records Processed:';
  RAISE NOTICE '  - Products: %', (SELECT COUNT(*) FROM public.products);
  RAISE NOTICE '  - Supplier Products: %', (SELECT COUNT(*) FROM public.supplier_products WHERE is_active = true);
  RAISE NOTICE '  - Region Products: %', (SELECT COUNT(*) FROM public.region_products WHERE is_active = true);
  RAISE NOTICE '  - Price History Records: %', (SELECT COUNT(*) FROM public.price_history);
  RAISE NOTICE '';
  RAISE NOTICE 'Configuration:';
  RAISE NOTICE '  - B2B Commission: %%%', (SELECT ROUND(commission_b2b * 100, 2) FROM public.pricing_config WHERE is_active = true);
  RAISE NOTICE '  - B2C Commission: %%%', (SELECT ROUND(commission_b2c * 100, 2) FROM public.pricing_config WHERE is_active = true);
  RAISE NOTICE '  - Calculation Mode: %', (SELECT price_calculation_mode FROM public.pricing_config WHERE is_active = true);
  RAISE NOTICE '';
  RAISE NOTICE 'Regional Multipliers:';
  FOR r IN SELECT name, price_multiplier FROM public.regions WHERE is_active = true ORDER BY name LOOP
    RAISE NOTICE '  - %: %', r.name, r.price_multiplier;
  END LOOP;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Review validation results above';
  RAISE NOTICE '2. Test calculate_product_price() RPC function';
  RAISE NOTICE '3. Run verification script';
  RAISE NOTICE '4. Deploy frontend changes';
  RAISE NOTICE '5. Monitor for 7 days';
  RAISE NOTICE '6. Run cleanup migration to deprecate old columns';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- This migration is complete and validated.
-- Old columns (products.price, products.base_price, region_products.price)
-- are preserved for rollback capability.
--
-- To rollback, execute: 20260110290000_pricing_redesign_rollback.sql
-- ============================================================================
