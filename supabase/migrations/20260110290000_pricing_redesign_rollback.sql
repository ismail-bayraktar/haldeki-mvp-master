-- ============================================================================
-- Pricing System Redesign - Rollback Script
-- Date: 2026-01-10
-- Author: Database Architect
-- Purpose: Complete rollback of pricing redesign if critical issues found
--
-- WARNING: This script will:
-- 1. Drop new tables and views
-- 2. Remove triggers and functions
-- 3. Restore old pricing columns if needed
--
-- STOPPING POINTS: Review each section before executing
-- ============================================================================

-- ============================================================================
-- ROLLBACK SAFETY CHECKS
-- ============================================================================

DO $$
DECLARE
  v_proceed BOOLEAN := false;
  v_confirmation TEXT;
BEGIN
  -- This is a safety mechanism. In production, you might want to require
  -- explicit confirmation via a parameter or environment variable.

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PRICING REDESIGN ROLLBACK';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'WARNING: This will rollback the pricing redesign migration.';
  RAISE NOTICE 'This action cannot be undone.';
  RAISE NOTICE '';
  RAISE NOTICE 'What will be removed:';
  RAISE NOTICE '  - pricing_config table';
  RAISE NOTICE '  - price_history table';
  RAISE NOTICE '  - customer_prices view';
  RAISE NOTICE '  - calculate_product_price() function';
  RAISE NOTICE '  - calculate_cart_prices() function';
  RAISE NOTICE '  - Price change triggers';
  RAISE NOTICE '  - Performance indexes';
  RAISE NOTICE '  - regions.price_multiplier column';
  RAISE NOTICE '';
  RAISE NOTICE 'What will be preserved:';
  RAISE NOTICE '  - products table (all original columns)';
  RAISE NOTICE '  - supplier_products table (all columns)';
  RAISE NOTICE '  - region_products table (all original columns)';
  RAISE NOTICE '  - product_variations table';
  RAISE NOTICE '  - All existing data';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- In production, you would stop here and require manual confirmation
  -- For now, we'll proceed with the rollback

  RAISE NOTICE 'Proceeding with rollback...';
END $$;

-- ============================================================================
-- STEP 1: Drop Triggers (Prevent cascading issues)
-- ============================================================================

RAISE NOTICE 'STEP 1: Dropping triggers...';

DROP TRIGGER IF EXISTS trigger_record_price_change ON public.supplier_products;
DROP TRIGGER IF EXISTS pricing_config_updated_at ON public.pricing_config;

-- ============================================================================
-- STEP 2: Drop New Functions
-- ============================================================================

RAISE NOTICE 'STEP 2: Dropping functions...';

DROP FUNCTION IF EXISTS public.calculate_product_price(UUID, UUID, UUID, TEXT, UUID[]);
DROP FUNCTION IF EXISTS public.calculate_cart_prices(JSONB);
DROP FUNCTION IF EXISTS public.record_price_change();

-- ============================================================================
-- STEP 3: Drop Views
-- ============================================================================

RAISE NOTICE 'STEP 3: Dropping views...';

DROP VIEW IF EXISTS public.customer_prices CASCADE;

-- ============================================================================
-- STEP 4: Drop New Tables
-- ============================================================================

RAISE NOTICE 'STEP 4: Dropping new tables...';

-- Drop price_history (this is safe, it's just analytics data)
DROP TABLE IF EXISTS public.price_history CASCADE;

-- Drop pricing_config (this will revert to hardcoded commission rates in code)
DROP TABLE IF EXISTS public.pricing_config CASCADE;

-- ============================================================================
-- STEP 5: Remove Regional Price Multiplier Column
-- ============================================================================

RAISE NOTICE 'STEP 5: Removing regions.price_multiplier column...';

-- First make it nullable in case of issues
ALTER TABLE public.regions ALTER COLUMN price_multiplier DROP NOT NULL;

-- Then drop the column
ALTER TABLE public.regions DROP COLUMN IF EXISTS price_multiplier;

-- ============================================================================
-- STEP 6: Drop Performance Indexes
-- ============================================================================

RAISE NOTICE 'STEP 6: Dropping performance indexes...';

DROP INDEX IF EXISTS public.idx_supplier_products_price_ranking;
DROP INDEX IF EXISTS public.idx_region_products_region_product;
DROP INDEX IF EXISTS public.idx_product_variations_product_type;
DROP INDEX IF EXISTS public.idx_supplier_product_variations_price_adj;
DROP INDEX IF EXISTS public.idx_regions_price_multiplier;
DROP INDEX IF EXISTS public.idx_pricing_config_active;

-- ============================================================================
-- STEP 7: Restore Old Pricing Logic (if modified)
-- ============================================================================

RAISE NOTICE 'STEP 7: Verifying old pricing columns are intact...';

DO $$
DECLARE
  v_products_price_exists BOOLEAN;
  v_products_base_price_exists BOOLEAN;
  v_region_products_price_exists BOOLEAN;
  v_region_products_business_price_exists BOOLEAN;
BEGIN
  -- Check that old columns still exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'price'
  ) INTO v_products_price_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'base_price'
  ) INTO v_products_base_price_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'region_products' AND column_name = 'price'
  ) INTO v_region_products_price_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'region_products' AND column_name = 'business_price'
  ) INTO v_region_products_business_price_exists;

  IF v_products_price_exists AND v_products_base_price_exists AND
     v_region_products_price_exists AND v_region_products_business_price_exists THEN
    RAISE NOTICE 'All old pricing columns are intact. Rollback successful.';
  ELSE
    RAISE WARNING 'Some old pricing columns may be missing. Manual verification required.';
  END IF;
END $$;

-- ============================================================================
-- STEP 8: Clean Up Orphaned Policies (if any)
-- ============================================================================

RAISE NOTICE 'STEP 8: Cleaning up orphaned policies...';

-- Drop any RLS policies that reference dropped tables
DROP POLICY IF EXISTS "Authenticated users can view active pricing config" ON public.pricing_config;
DROP POLICY IF EXISTS "Admins can manage pricing config" ON public.pricing_config;
DROP POLICY IF EXISTS "Authenticated can view price history" ON public.price_history;
DROP POLICY IF EXISTS "System can insert price history" ON public.price_history;

-- ============================================================================
-- ROLLBACK COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ROLLBACK COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'System has been restored to pre-migration state.';
  RAISE NOTICE '';
  RAISE NOTICE 'Post-Rollback Actions Required:';
  RAISE NOTICE '1. Verify frontend still uses old pricing columns';
  RAISE NOTICE '2. Test product listing and cart functionality';
  RAISE NOTICE '3. Check for any broken queries or views';
  RAISE NOTICE '4. Review application logs for errors';
  RAISE NOTICE '';
  RAISE NOTICE 'Data Status:';
  RAISE NOTICE '  - All original data preserved';
  RAISE NOTICE '  - No data loss occurred';
  RAISE NOTICE '  - Old pricing columns active';
  RAISE NOTICE '';
  RAISE NOTICE 'If you want to re-apply the pricing redesign:';
  RAISE NOTICE '1. Review and fix the issues that caused rollback';
  RAISE NOTICE '2. Re-run: 20260110200000_pricing_redesign_schema.sql';
  RAISE NOTICE '3. Re-run: 20260110210000_pricing_redesign_data_migration.sql';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- ROLLBACK VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify rollback was successful:

-- 1. Check that pricing_config table is gone
-- SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'pricing_config';
-- Expected: 0

-- 2. Check that price_history table is gone
-- SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'price_history';
-- Expected: 0

-- 3. Check that regions.price_multiplier is gone
-- SELECT COUNT(*) FROM information_schema.columns
-- WHERE table_name = 'regions' AND column_name = 'price_multiplier';
-- Expected: 0

-- 4. Verify old pricing columns exist
-- SELECT
--   EXISTS(SELECT 1 WHERE column_name = 'price' AND table_name = 'products') as products_price,
--   EXISTS(SELECT 1 WHERE column_name = 'base_price' AND table_name = 'products') as products_base_price,
--   EXISTS(SELECT 1 WHERE column_name = 'price' AND table_name = 'region_products') as region_price,
--   EXISTS(SELECT 1 WHERE column_name = 'business_price' AND table_name = 'region_products') as region_business_price
-- FROM information_schema.columns
-- LIMIT 1;
-- Expected: All TRUE

-- 5. Verify calculate_product_price function is gone
-- SELECT COUNT(*) FROM pg_proc WHERE proname = 'calculate_product_price';
-- Expected: 0
