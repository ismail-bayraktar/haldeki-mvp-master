-- ============================================================================
-- Pricing System Redesign - Verification & Testing Script
-- Date: 2026-01-10
-- Author: Database Architect
-- Purpose: Comprehensive testing of new pricing system
--
-- Run this AFTER data migration to verify everything works correctly.
-- ============================================================================

-- ============================================================================
-- TEST 1: Schema Verification
-- ============================================================================

DO $$
DECLARE
  v_test_name TEXT := 'Schema Verification';
  v_passed INTEGER := 0;
  v_failed INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST: % ===', v_test_name;

  -- Check pricing_config table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_config') THEN
    v_passed := v_passed + 1;
    RAISE NOTICE '[PASS] pricing_config table exists';
  ELSE
    v_failed := v_failed + 1;
    RAISE NOTICE '[FAIL] pricing_config table missing';
  END IF;

  -- Check price_history table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'price_history') THEN
    v_passed := v_passed + 1;
    RAISE NOTICE '[PASS] price_history table exists';
  ELSE
    v_failed := v_failed + 1;
    RAISE NOTICE '[FAIL] price_history table missing';
  END IF;

  -- Check customer_prices view exists
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'customer_prices') THEN
    v_passed := v_passed + 1;
    RAISE NOTICE '[PASS] customer_prices view exists';
  ELSE
    v_failed := v_failed + 1;
    RAISE NOTICE '[FAIL] customer_prices view missing';
  END IF;

  -- Check calculate_product_price function exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_product_price') THEN
    v_passed := v_passed + 1;
    RAISE NOTICE '[PASS] calculate_product_price function exists';
  ELSE
    v_failed := v_failed + 1;
    RAISE NOTICE '[FAIL] calculate_product_price function missing';
  END IF;

  -- Check regions.price_multiplier column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'regions' AND column_name = 'price_multiplier'
  ) THEN
    v_passed := v_passed + 1;
    RAISE NOTICE '[PASS] regions.price_multiplier column exists';
  ELSE
    v_failed := v_failed + 1;
    RAISE NOTICE '[FAIL] regions.price_multiplier column missing';
  END IF;

  RAISE NOTICE 'Result: % passed, % failed', v_passed, v_failed;
  IF v_failed > 0 THEN
    RAISE EXCEPTION 'Schema verification failed with % errors', v_failed;
  END IF;
END $$;

-- ============================================================================
-- TEST 2: Configuration Verification
-- ============================================================================

DO $$
DECLARE
  v_config RECORD;
  v_test_name TEXT := 'Configuration Verification';
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST: % ===', v_test_name;

  SELECT * INTO v_config
  FROM public.pricing_config
  WHERE is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION '[FAIL] No active pricing configuration found';
  END IF;

  RAISE NOTICE '[PASS] Active pricing config found';
  RAISE NOTICE '  - B2B Commission: %%%', ROUND(v_config.commission_b2b * 100, 2);
  RAISE NOTICE '  - B2C Commission: %%%', ROUND(v_config.commission_b2c * 100, 2);
  RAISE NOTICE '  - Calculation Mode: %', v_config.price_calculation_mode;
  RAISE NOTICE '  - Regional Pricing Mode: %', v_config.regional_pricing_mode;

  -- Validate commission rates are in expected range
  IF v_config.commission_b2b < 0 OR v_config.commission_b2b >= 1 THEN
    RAISE EXCEPTION '[FAIL] Invalid B2B commission rate: %', v_config.commission_b2b;
  END IF;

  IF v_config.commission_b2c < 0 OR v_config.commission_b2c >= 1 THEN
    RAISE EXCEPTION '[FAIL] Invalid B2C commission rate: %', v_config.commission_b2c;
  END IF;

  RAISE NOTICE '[PASS] Commission rates are valid';
END $$;

-- ============================================================================
-- TEST 3: Regional Multiplier Verification
-- ============================================================================

DO $$
DECLARE
  v_region RECORD;
  v_test_name TEXT := 'Regional Multiplier Verification';
  v_invalid_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST: % ===', v_test_name;

  -- Check all active regions have valid multipliers
  FOR v_region IN
    SELECT id, name, price_multiplier
    FROM public.regions
    WHERE is_active = true
  LOOP
    IF v_region.price_multiplier IS NULL OR v_region.price_multiplier <= 0 THEN
      RAISE NOTICE '[FAIL] Region % has invalid multiplier: %',
        v_region.name, v_region.price_multiplier;
      v_invalid_count := v_invalid_count + 1;
    ELSE
      RAISE NOTICE '[PASS] Region %: multiplier = %',
        v_region.name, v_region.price_multiplier;
    END IF;
  END LOOP;

  IF v_invalid_count > 0 THEN
    RAISE EXCEPTION 'Found % regions with invalid multipliers', v_invalid_count;
  END IF;
END $$;

-- ============================================================================
-- TEST 4: Price Calculation Function Tests
-- ============================================================================

DO $$
DECLARE
  v_test_product_id UUID;
  v_test_region_id UUID;
  v_price_result RECORD;
  v_test_name TEXT := 'Price Calculation Function';
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST: % ===', v_test_name;

  -- Get a test product and region
  SELECT p.id, r.id INTO v_test_product_id, v_test_region_id
  FROM public.products p
  INNER JOIN public.region_products rp ON rp.product_id = p.id
  INNER JOIN public.regions r ON r.id = rp.region_id
  WHERE p.is_active = true AND rp.is_active = true AND r.is_active = true
  LIMIT 1;

  IF v_test_product_id IS NULL THEN
    RAISE EXCEPTION '[FAIL] No test product found';
  END IF;

  RAISE NOTICE 'Testing with product_id: %, region_id: %', v_test_product_id, v_test_region_id;

  -- Test B2C price calculation
  SELECT * INTO v_price_result
  FROM public.calculate_product_price(
    v_test_product_id,
    v_test_region_id,
    NULL, -- supplier_id (auto-select cheapest)
    'b2c'
  )
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION '[FAIL] calculate_product_price returned no results for B2C';
  END IF;

  IF v_price_result.final_price IS NULL OR v_price_result.final_price <= 0 THEN
    RAISE EXCEPTION '[FAIL] Invalid B2C final price: %', v_price_result.final_price;
  END IF;

  RAISE NOTICE '[PASS] B2C price calculation works';
  RAISE NOTICE '  - Supplier price: %', v_price_result.supplier_price;
  RAISE NOTICE '  - B2C price: %', v_price_result.b2c_price;
  RAISE NOTICE '  - Final price: %', v_price_result.final_price;

  -- Test B2B price calculation
  SELECT * INTO v_price_result
  FROM public.calculate_product_price(
    v_test_product_id,
    v_test_region_id,
    NULL,
    'b2b'
  )
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION '[FAIL] calculate_product_price returned no results for B2B';
  END IF;

  IF v_price_result.final_price IS NULL OR v_price_result.final_price <= 0 THEN
    RAISE EXCEPTION '[FAIL] Invalid B2B final price: %', v_price_result.final_price;
  END IF;

  RAISE NOTICE '[PASS] B2B price calculation works';
  RAISE NOTICE '  - Supplier price: %', v_price_result.supplier_price;
  RAISE NOTICE '  - B2B price: %', v_price_result.b2b_price;
  RAISE NOTICE '  - Final price: %', v_price_result.final_price;

  -- Verify B2B < B2C (B2B should be cheaper due to lower commission)
  IF v_price_result.b2b_price >= v_price_result.b2c_price THEN
    RAISE WARNING '[WARN] B2B price (%) >= B2C price (%). Expected B2B < B2C.',
      v_price_result.b2b_price, v_price_result.b2c_price;
  ELSE
    RAISE NOTICE '[PASS] B2B price < B2C price (as expected)';
  END IF;
END $$;

-- ============================================================================
-- TEST 5: Customer Prices View
-- ============================================================================

DO $$
DECLARE
  v_view_count INTEGER;
  v_sample_record RECORD;
  v_test_name TEXT := 'Customer Prices View';
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST: % ===', v_test_name;

  -- Check view returns data
  SELECT COUNT(*) INTO v_view_count
  FROM public.customer_prices;

  IF v_view_count = 0 THEN
    RAISE EXCEPTION '[FAIL] customer_prices view returns no data';
  END IF;

  RAISE NOTICE '[PASS] customer_prices view returns % records', v_view_count;

  -- Check a sample record for data integrity
  SELECT * INTO v_sample_record
  FROM public.customer_prices
  LIMIT 1;

  IF v_sample_record.product_id IS NULL THEN
    RAISE EXCEPTION '[FAIL] customer_prices view has NULL product_id';
  END IF;

  IF v_sample_record.supplier_price IS NULL OR v_sample_record.supplier_price <= 0 THEN
    RAISE EXCEPTION '[FAIL] customer_prices view has invalid supplier_price';
  END IF;

  IF v_sample_record.b2b_price IS NULL OR v_sample_record.b2b_price <= 0 THEN
    RAISE EXCEPTION '[FAIL] customer_prices view has invalid b2b_price';
  END IF;

  IF v_sample_record.b2c_price IS NULL OR v_sample_record.b2c_price <= 0 THEN
    RAISE EXCEPTION '[FAIL] customer_prices view has invalid b2c_price';
  END IF;

  RAISE NOTICE '[PASS] Sample record data integrity check passed';
  RAISE NOTICE '  - Product: %', v_sample_record.product_name;
  RAISE NOTICE '  - Supplier: %', v_sample_record.supplier_name;
  RAISE NOTICE '  - Region: %', v_sample_record.region_name;
  RAISE NOTICE '  - B2B: % | B2C: %', v_sample_record.b2b_price, v_sample_record.b2c_price;
END $$;

-- ============================================================================
-- TEST 6: Price History Tracking
-- ============================================================================

DO $$
DECLARE
  v_history_count INTEGER;
  v_test_name TEXT := 'Price History Tracking';
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST: % ===', v_test_name;

  -- Check price history was populated
  SELECT COUNT(*) INTO v_history_count
  FROM public.price_history;

  IF v_history_count = 0 THEN
    RAISE WARNING '[WARN] Price history table is empty. Expected records from migration.';
  ELSE
    RAISE NOTICE '[PASS] Price history contains % records', v_history_count;
  END IF;

  -- Check recent history records have required fields
  PERFORM *
  FROM public.price_history
  WHERE recorded_at > NOW() - INTERVAL '1 hour'
  LIMIT 1;

  IF FOUND THEN
    RAISE NOTICE '[PASS] Recent price history records found';
  END IF;
END $$;

-- ============================================================================
-- TEST 7: Variation Price Adjustments
-- ============================================================================

DO $$
DECLARE
  v_test_product_id UUID;
  v_test_variation_id UUID;
  v_price_with_variation RECORD;
  v_price_without_variation RECORD;
  v_test_name TEXT := 'Variation Price Adjustments';
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST: % ===', v_test_name;

  -- Find a product with variations
  SELECT sp.product_id, pv.id INTO v_test_product_id, v_test_variation_id
  FROM public.supplier_product_variations spv
  INNER JOIN public.supplier_products sp ON sp.id = spv.supplier_product_id
  INNER JOIN public.product_variations pv ON pv.id = spv.variation_id
  WHERE spv.price_adjustment != 0
  LIMIT 1;

  IF v_test_product_id IS NULL THEN
    RAISE NOTICE '[SKIP] No products with variation price adjustments found';
    RETURN;
  END IF;

  RAISE NOTICE 'Testing with product_id: %, variation_id: %',
    v_test_product_id, v_test_variation_id;

  -- Get price without variation
  SELECT * INTO v_price_without_variation
  FROM public.calculate_product_price(
    v_test_product_id,
    NULL, -- region_id
    NULL, -- supplier_id
    'b2c',
    NULL -- no variations
  )
  LIMIT 1;

  -- Get price with variation
  SELECT * INTO v_price_with_variation
  FROM public.calculate_product_price(
    v_test_product_id,
    NULL,
    NULL,
    'b2c',
    ARRAY[v_test_variation_id]
  )
  LIMIT 1;

  IF v_price_with_variation.variation_adjustment = 0 THEN
    RAISE WARNING '[WARN] Variation adjustment is 0, expected non-zero';
  ELSE
    RAISE NOTICE '[PASS] Variation adjustment applied: %', v_price_with_variation.variation_adjustment;
  END IF;

  -- Verify prices differ by the adjustment amount
  IF ABS(v_price_with_variation.final_price - v_price_without_variation.final_price)
     < ABS(v_price_with_variation.variation_adjustment) * 0.9 THEN
    RAISE WARNING '[WARN] Price difference does not match variation adjustment';
  ELSE
    RAISE NOTICE '[PASS] Price difference matches variation adjustment';
  END IF;
END $$;

-- ============================================================================
-- TEST 8: Performance Check (Index Usage)
-- ============================================================================

DO $$
DECLARE
  v_test_name TEXT := 'Performance Check';
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_duration NUMERIC;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST: % ===', v_test_name;

  -- Test customer_prices view performance
  v_start_time := CLOCK_TIMESTAMP();

  PERFORM *
  FROM public.customer_prices
  LIMIT 100;

  v_end_time := CLOCK_TIMESTAMP();
  v_duration := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;

  IF v_duration > 1000 THEN
    RAISE WARNING '[WARN] customer_prices view slow: %ms (expected < 1000ms)', v_duration;
  ELSE
    RAISE NOTICE '[PASS] customer_prices view performance: %ms', v_duration;
  END IF;

  -- Test calculate_product_price performance
  v_start_time := CLOCK_TIMESTAMP();

  SELECT * FROM public.calculate_product_price(
    (SELECT id FROM public.products WHERE is_active = true LIMIT 1),
    (SELECT id FROM public.regions WHERE is_active = true LIMIT 1),
    NULL,
    'b2c'
  );

  v_end_time := CLOCK_TIMESTAMP();
  v_duration := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;

  IF v_duration > 100 THEN
    RAISE WARNING '[WARN] calculate_product_price slow: %ms (expected < 100ms)', v_duration;
  ELSE
    RAISE NOTICE '[PASS] calculate_product_price performance: %ms', v_duration;
  END IF;
END $$;

-- ============================================================================
-- TEST 9: Data Integrity Summary
-- ============================================================================

DO $$
DECLARE
  v_products_count INTEGER;
  v_supplier_products_count INTEGER;
  v_region_products_count INTEGER;
  v_orphan_products INTEGER;
  v_zero_prices INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST: Data Integrity Summary ===';

  SELECT COUNT(*) INTO v_products_count FROM public.products WHERE is_active = true;
  SELECT COUNT(*) INTO v_supplier_products_count FROM public.supplier_products WHERE is_active = true;
  SELECT COUNT(*) INTO v_region_products_count FROM public.region_products WHERE is_active = true;

  RAISE NOTICE 'Active Products: %', v_products_count;
  RAISE NOTICE 'Active Supplier Products: %', v_supplier_products_count;
  RAISE NOTICE 'Active Region Products: %', v_region_products_count;

  -- Check for orphans
  SELECT COUNT(DISTINCT p.id) INTO v_orphan_products
  FROM public.products p
  LEFT JOIN public.supplier_products sp ON sp.product_id = p.id AND sp.is_active = true
  WHERE p.is_active = true AND sp.id IS NULL;

  IF v_orphan_products > 0 THEN
    RAISE WARNING '[WARN] % active products have no supplier', v_orphan_products;
  ELSE
    RAISE NOTICE '[PASS] All active products have suppliers';
  END IF;

  -- Check for zero prices
  SELECT COUNT(*) INTO v_zero_prices
  FROM public.supplier_products
  WHERE is_active = true AND (price IS NULL OR price <= 0);

  IF v_zero_prices > 0 THEN
    RAISE WARNING '[WARN] % active supplier_products have invalid prices', v_zero_prices;
  ELSE
    RAISE NOTICE '[PASS] All active supplier_products have valid prices';
  END IF;
END $$;

-- ============================================================================
-- TEST SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'If all tests passed, the pricing redesign is ready for production.';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Review any warnings above';
  RAISE NOTICE '2. Run manual testing in staging environment';
  RAISE NOTICE '3. Update frontend to use calculate_product_price() RPC';
  RAISE NOTICE '4. Deploy to production with monitoring';
  RAISE NOTICE '5. Monitor for 7 days before cleanup';
  RAISE NOTICE '';
  RAISE NOTICE 'If critical issues found:';
  RAISE NOTICE '1. Document the issues';
  RAISE NOTICE '2. Run rollback script: 20260110290000_pricing_redesign_rollback.sql';
  RAISE NOTICE '3. Fix issues and re-migrate';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
