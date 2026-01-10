-- ============================================================================
-- PRICING REDESIGN - ALL MIGRATIONS (COMBINED)
-- ============================================================================
-- This file combines all pricing redesign migrations into a single script
-- for manual execution via Supabase SQL Editor.
--
-- EXECUTION ORDER:
--   1. Schema Migration (creates tables, views, functions)
--   2. Data Migration (migrates data, validates)
--   3. Verification (tests all functionality)
--
-- INSTRUCTIONS:
--   1. Open Supabase SQL Editor: https://app.supabase.com/project/ynatuiwdvkxcmmnmejkl/sql
--   2. Copy entire contents of this file
--   3. Paste into SQL Editor
--   4. Click "Run" to execute
--   5. Review output for any errors
--
-- ROLLBACK (if needed):
--   Execute the file: supabase/migrations/20260110290000_pricing_redesign_rollback.sql
-- ============================================================================

-- ============================================================================
-- PART 1: SCHEMA MIGRATION
-- ============================================================================
-- Pricing System Redesign - New Schema
-- Date: 2026-01-10
-- Author: Database Architect
-- Purpose: Simplify 4-layer pricing into single source of truth
--
-- PROBLEM: 4 pricing layers causing confusion
--   products.price, products.base_price
--   region_products.price, region_products.business_price
--   supplier_products.price
--   supplier_product_variations.price_adjustment
--
-- SOLUTION: Single source (supplier_products.price) + multipliers
--   supplier_products.price = base truth
--   pricing_config.commission_b2b/commission_b2c = platform fees
--   regional_price_multiplier = regional adjustments
--   product_variations.price_adjustment = variant pricing
--
-- MIGRATION PATH:
--   1. Create new tables (non-breaking)
--   2. Migrate data
--   3. Verify integrity
--   4. Switch traffic
--   5. Deprecate old columns (7-day grace period)
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Pricing Configuration Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Commission rates (platform fees)
  commission_b2b NUMERIC(5, 4) NOT NULL DEFAULT 0.30 CHECK (commission_b2b >= 0 AND commission_b2b < 1),
  commission_b2c NUMERIC(5, 4) NOT NULL DEFAULT 0.50 CHECK (commission_b2c >= 0 AND commission_b2c < 1),

  -- Pricing logic settings
  price_calculation_mode TEXT NOT NULL DEFAULT 'markup' CHECK (price_calculation_mode IN ('markup', 'margin')),
  -- markup: price = supplier_price / (1 - commission)
  -- margin: price = supplier_price * (1 + commission)

  -- Regional pricing mode
  regional_pricing_mode TEXT NOT NULL DEFAULT 'multiplier' CHECK (regional_pricing_mode IN ('multiplier', 'fixed')),
  -- multiplier: final = supplier_price * regional_multiplier
  -- fixed: final = region_products.price (legacy mode)

  -- Rounding settings
  round_to_nearest NUMERIC(10, 2) DEFAULT 0.01 CHECK (round_to_nearest > 0),

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Partial unique index: Only one active config at a time
CREATE UNIQUE INDEX pricing_config_active_unique
  ON public.pricing_config(is_active)
  WHERE is_active = true;

-- Index for quick config lookup
CREATE INDEX idx_pricing_config_active
  ON public.pricing_config(is_active)
  WHERE is_active = true;

-- Trigger to update updated_at
CREATE TRIGGER pricing_config_updated_at
  BEFORE UPDATE ON public.pricing_config
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view active pricing config"
ON public.pricing_config
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage pricing config"
ON public.pricing_config
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
  )
);

-- Insert default configuration
INSERT INTO public.pricing_config (commission_b2b, commission_b2c, price_calculation_mode, regional_pricing_mode)
VALUES (0.30, 0.50, 'markup', 'multiplier');

-- ============================================================================
-- STEP 2: Regional Price Multipliers
-- ============================================================================

-- Add price_multiplier column to regions table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'regions' AND column_name = 'price_multiplier'
  ) THEN
    ALTER TABLE public.regions ADD COLUMN price_multiplier NUMERIC(5, 4) DEFAULT 1.00 CHECK (price_multiplier > 0);
  END IF;
END $$;

-- Update existing regions with default multipliers
UPDATE public.regions SET price_multiplier = 1.00 WHERE price_multiplier IS NULL;

-- Ensure NOT NULL constraint
ALTER TABLE public.regions ALTER COLUMN price_multiplier SET NOT NULL;

-- Create index for regional pricing queries
CREATE INDEX IF NOT EXISTS idx_regions_price_multiplier ON public.regions(price_multiplier);

-- ============================================================================
-- STEP 3: Customer Price Calculation View (Single Source of Truth)
-- ============================================================================

-- Drop old view if exists
DROP VIEW IF EXISTS public.customer_prices CASCADE;

-- Create comprehensive price calculation view
CREATE OR REPLACE VIEW public.customer_prices AS
WITH supplier_base AS (
  -- Get supplier base prices
  SELECT
    sp.product_id,
    sp.supplier_id,
    sp.price as supplier_price,
    sp.price_change,
    sp.availability,
    sp.stock_quantity,
    sp.quality,
    sp.is_featured,
    -- ROW_NUMBER() for ranking suppliers by price
    ROW_NUMBER() OVER (PARTITION BY sp.product_id ORDER BY sp.price ASC) as price_rank
  FROM public.supplier_products sp
  INNER JOIN public.suppliers s ON s.id = sp.supplier_id
  WHERE sp.is_active = true AND s.is_active = true
),
regional_multipliers AS (
  -- Get regional multipliers
  SELECT
    rp.product_id,
    rp.region_id,
    r.price_multiplier,
    -- Legacy: if fixed pricing mode, use region_products.price
    -- This will be phased out after migration
    rp.price as legacy_region_price,
    rp.business_price as legacy_business_price
  FROM public.region_products rp
  INNER JOIN public.regions r ON r.id = rp.region_id
  WHERE rp.is_active = true
),
config AS (
  -- Get active pricing config
  SELECT *
  FROM public.pricing_config
  WHERE is_active = true
  LIMIT 1
)
SELECT
  p.id as product_id,
  p.name as product_name,
  p.category,
  p.unit,
  p.images[1] as image_url,

  -- Supplier information
  sb.supplier_id,
  s.name as supplier_name,
  sb.supplier_price,
  sb.price_change,
  sb.availability,
  sb.stock_quantity,
  sb.quality,
  sb.is_featured,
  sb.price_rank,

  -- Regional information
  rm.region_id,
  r.name as region_name,
  rm.price_multiplier as regional_multiplier,

  -- Pricing calculation
  CASE
    WHEN config.regional_pricing_mode = 'multiplier' THEN
      -- Markup mode: price = supplier_price / (1 - commission) * regional_multiplier
      CASE config.price_calculation_mode
        WHEN 'markup' THEN ROUND(
          (sb.supplier_price / (1 - config.commission_b2c)) * rm.price_multiplier,
          2
        )
        -- Margin mode: price = supplier_price * (1 + commission) * regional_multiplier
        ELSE ROUND(
          (sb.supplier_price * (1 + config.commission_b2c)) * rm.price_multiplier,
          2
        )
      END
    ELSE
      -- Legacy fixed pricing (will be removed)
      COALESCE(rm.legacy_region_price, sb.supplier_price)
  END as b2c_price,

  CASE
    WHEN config.regional_pricing_mode = 'multiplier' THEN
      CASE config.price_calculation_mode
        WHEN 'markup' THEN ROUND(
          (sb.supplier_price / (1 - config.commission_b2b)) * rm.price_multiplier,
          2
        )
        ELSE ROUND(
          (sb.supplier_price * (1 + config.commission_b2b)) * rm.price_multiplier,
          2
        )
      END
    ELSE
      COALESCE(rm.legacy_business_price, sb.supplier_price)
  END as b2b_price,

  -- Price breakdown (for debugging/transparency)
  config.commission_b2b,
  config.commission_b2c,
  config.price_calculation_mode,
  config.regional_pricing_mode,

  NOW() as calculated_at

FROM public.products p
INNER JOIN supplier_base sb ON sb.product_id = p.id
INNER JOIN public.suppliers s ON s.id = sb.supplier_id
INNER JOIN regional_multipliers rm ON rm.product_id = p.id
INNER JOIN public.regions r ON r.id = rm.region_id
CROSS JOIN config
WHERE p.is_active = true OR p.product_status = 'active';

-- Grant access to view
GRANT SELECT ON public.customer_prices TO authenticated;
GRANT SELECT ON public.customer_prices TO public;

-- ============================================================================
-- STEP 4: Price History Tracking (for analytics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,

  -- Price data
  supplier_price NUMERIC(10, 2) NOT NULL,
  b2b_price NUMERIC(10, 2),
  b2c_price NUMERIC(10, 2),
  regional_multiplier NUMERIC(5, 4) DEFAULT 1.00,

  -- Metadata
  commission_rate_b2b NUMERIC(5, 4),
  commission_rate_b2c NUMERIC(5, 4),
  calculation_mode TEXT,

  -- Context
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,

  -- Timestamp
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX idx_price_history_product ON public.price_history(product_id, recorded_at DESC);
CREATE INDEX idx_price_history_supplier ON public.price_history(supplier_id, recorded_at DESC);
CREATE INDEX idx_price_history_region ON public.price_history(region_id, recorded_at DESC);
CREATE INDEX idx_price_history_recorded_at ON public.price_history(recorded_at DESC);

-- Enable RLS
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies (append-only, admins can read)
CREATE POLICY "Authenticated can view price history"
ON public.price_history
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can insert price history"
ON public.price_history
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Comment
COMMENT ON TABLE public.price_history IS 'Historical price tracking for analytics and debugging';

-- ============================================================================
-- STEP 5: Centralized Price Calculation RPC Function
-- ============================================================================

-- Drop old function if exists
DROP FUNCTION IF EXISTS public.calculate_product_price CASCADE;

CREATE OR REPLACE FUNCTION public.calculate_product_price(
  p_product_id UUID,
  p_region_id UUID DEFAULT NULL,
  p_supplier_id UUID DEFAULT NULL,
  p_user_role TEXT DEFAULT 'b2c', -- 'b2b' or 'b2c'
  p_variation_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  supplier_id UUID,
  supplier_name TEXT,
  region_id UUID,
  region_name TEXT,

  -- Price breakdown
  supplier_price NUMERIC(10, 2),
  variation_adjustment NUMERIC(10, 2),
  regional_multiplier NUMERIC(5, 4),
  commission_rate NUMERIC(5, 4),

  -- Final prices
  b2b_price NUMERIC(10, 2),
  b2c_price NUMERIC(10, 2),
  final_price NUMERIC(10, 2),

  -- Metadata
  price_calculation_mode TEXT,
  regional_pricing_mode TEXT,
  calculated_at TIMESTAMPTZ,

  -- Additional info
  availability public.availability_status,
  stock_quantity INTEGER,
  is_featured BOOLEAN,
  price_rank INTEGER
) AS $$
DECLARE
  v_config RECORD;
  v_supplier_price NUMERIC(10, 2);
  v_supplier_id UUID;
  v_supplier_name TEXT;
  v_availability public.availability_status;
  v_stock_quantity INTEGER;
  v_is_featured BOOLEAN;
  v_price_rank INTEGER;
  v_variation_price_adj NUMERIC(10, 2) DEFAULT 0;
  v_regional_multiplier NUMERIC(5, 4) DEFAULT 1.00;
  v_commission_rate NUMERIC(5, 4);
  v_b2b_price NUMERIC(10, 2);
  v_b2c_price NUMERIC(10, 2);
  v_final_price NUMERIC(10, 2);
BEGIN
  -- Get active pricing config
  SELECT * INTO v_config
  FROM public.pricing_config
  WHERE is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active pricing configuration found';
  END IF;

  -- Set commission rate based on user role
  v_commission_rate := CASE
    WHEN p_user_role = 'b2b' THEN v_config.commission_b2b
    ELSE v_config.commission_b2c
  END;

  -- Get regional multiplier if region specified
  IF p_region_id IS NOT NULL THEN
    SELECT price_multiplier INTO v_regional_multiplier
    FROM public.regions
    WHERE id = p_region_id;
  END IF;

  -- Get supplier price (cheapest active supplier if not specified)
  SELECT
    sp.price,
    s.id,
    s.name,
    sp.availability,
    sp.stock_quantity,
    sp.is_featured,
    ROW_NUMBER() OVER (ORDER BY sp.price ASC)
  INTO v_supplier_price, v_supplier_id, v_supplier_name,
       v_availability, v_stock_quantity, v_is_featured, v_price_rank
  FROM public.supplier_products sp
  INNER JOIN public.suppliers s ON s.id = sp.supplier_id
  WHERE sp.product_id = p_product_id
    AND sp.is_active = true
    AND s.is_active = true
    AND (p_supplier_id IS NULL OR sp.supplier_id = p_supplier_id)
  ORDER BY sp.price ASC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active supplier found for product %', p_product_id;
  END IF;

  -- Calculate variation price adjustment
  IF p_variation_ids IS NOT NULL AND array_length(p_variation_ids, 1) > 0 THEN
    SELECT COALESCE(SUM(price_adjustment), 0) INTO v_variation_price_adj
    FROM public.supplier_product_variations
    WHERE supplier_product_id IN (
      SELECT id FROM public.supplier_products
      WHERE product_id = p_product_id AND supplier_id = v_supplier_id
    )
    AND variation_id = ANY(p_variation_ids);
  END IF;

  -- Calculate final prices
  v_b2b_price := CASE
    WHEN v_config.price_calculation_mode = 'markup' THEN
      ROUND((v_supplier_price + v_variation_price_adj) / (1 - v_config.commission_b2b) * v_regional_multiplier, 2)
    ELSE
      ROUND((v_supplier_price + v_variation_price_adj) * (1 + v_config.commission_b2b) * v_regional_multiplier, 2)
  END;

  v_b2c_price := CASE
    WHEN v_config.price_calculation_mode = 'markup' THEN
      ROUND((v_supplier_price + v_variation_price_adj) / (1 - v_config.commission_b2c) * v_regional_multiplier, 2)
    ELSE
      ROUND((v_supplier_price + v_variation_price_adj) * (1 + v_config.commission_b2c) * v_regional_multiplier, 2)
  END;

  v_final_price := CASE
    WHEN p_user_role = 'b2b' THEN v_b2b_price
    ELSE v_b2c_price
  END;

  -- Return result set
  RETURN QUERY
  SELECT
    p_product_id,
    p.name,
    v_supplier_id,
    v_supplier_name,
    p_region_id,
    (SELECT name FROM public.regions WHERE id = p_region_id),

    v_supplier_price,
    v_variation_price_adj,
    v_regional_multiplier,
    v_commission_rate,

    v_b2b_price,
    v_b2c_price,
    v_final_price,

    v_config.price_calculation_mode,
    v_config.regional_pricing_mode,
    NOW(),

    v_availability,
    v_stock_quantity,
    v_is_featured,
    v_price_rank

  FROM public.products p
  WHERE p.id = p_product_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.calculate_product_price(
  UUID, UUID, UUID, TEXT, UUID[]
) TO authenticated;

-- Comment
COMMENT ON FUNCTION public.calculate_product_price IS 'Centralized price calculation with B2B/B2C support, regional multipliers, and variation adjustments';

-- ============================================================================
-- STEP 6: Bulk Cart Price Calculation RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_cart_prices(
  p_items JSONB -- Array of {product_id, region_id, supplier_id, quantity, variation_ids[]}
)
RETURNS TABLE (
  item_index INTEGER,
  product_id UUID,
  product_name TEXT,
  supplier_id UUID,
  supplier_name TEXT,
  quantity INTEGER,
  unit_price NUMERIC(10, 2),
  total_price NUMERIC(10, 2),
  b2b_price NUMERIC(10, 2),
  b2c_price NUMERIC(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (row_number() OVER ())::INTEGER as item_index,
    calc.product_id,
    calc.product_name,
    calc.supplier_id,
    calc.supplier_name,
    (p_items->(row_number() OVER () - 1)->>'quantity')::INTEGER as quantity,
    calc.final_price as unit_price,
    calc.final_price * (p_items->(row_number() OVER () - 1)->>'quantity')::NUMERIC as total_price,
    calc.b2b_price,
    calc.b2c_price
  FROM public.calculate_product_price(
    (p_items->(row_number() OVER () - 1)->>'product_id')::UUID,
    (p_items->(row_number() OVER () - 1)->>'region_id')::UUID,
    (p_items->(row_number() OVER () - 1)->>'supplier_id')::UUID,
    COALESCE((p_items->(row_number() OVER () - 1)->>'user_role'), 'b2c'),
    (p_items->(row_number() OVER () - 1)->>'variation_ids')::UUID[]
  ) calc
  CROSS JOIN LATERAL jsonb_array_elements(p_items) WITH ORDINALITY AS item(item_json, item_idx);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.calculate_cart_prices(JSONB) TO authenticated;

-- ============================================================================
-- STEP 7: Indexes for Performance
-- ============================================================================

-- Composite index for supplier_products price queries
CREATE INDEX IF NOT EXISTS idx_supplier_products_price_ranking
ON public.supplier_products(product_id, is_active, price)
WHERE is_active = true;

-- Index for region_products with regional multiplier
CREATE INDEX IF NOT EXISTS idx_region_products_region_product
ON public.region_products(region_id, product_id)
WHERE is_active = true;

-- Index for product variations lookup
CREATE INDEX IF NOT EXISTS idx_product_variations_product_type
ON public.product_variations(product_id, variation_type);

-- Index for supplier product variations price adjustment
CREATE INDEX IF NOT EXISTS idx_supplier_product_variations_price_adj
ON public.supplier_product_variations(variation_id)
WHERE price_adjustment != 0;

-- ============================================================================
-- STEP 8: Triggers for Price History Tracking
-- ============================================================================

-- Function to record price changes
CREATE OR REPLACE FUNCTION record_price_change()
RETURNS TRIGGER AS $$
DECLARE
  v_config RECORD;
BEGIN
  -- Get active config
  SELECT * INTO v_config
  FROM public.pricing_config
  WHERE is_active = true
  LIMIT 1;

  -- Only record if price actually changed
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    -- Record for all active regions
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
      changed_by,
      change_reason
    )
    SELECT
      NEW.product_id,
      NEW.supplier_id,
      r.id as region_id,
      NEW.price as supplier_price,
      -- Calculate B2B price
      CASE v_config.price_calculation_mode
        WHEN 'markup' THEN ROUND(NEW.price / (1 - v_config.commission_b2b) * r.price_multiplier, 2)
        ELSE ROUND(NEW.price * (1 + v_config.commission_b2b) * r.price_multiplier, 2)
      END,
      -- Calculate B2C price
      CASE v_config.price_calculation_mode
        WHEN 'markup' THEN ROUND(NEW.price / (1 - v_config.commission_b2c) * r.price_multiplier, 2)
        ELSE ROUND(NEW.price * (1 + v_config.commission_b2c) * r.price_multiplier, 2)
      END,
      r.price_multiplier,
      v_config.commission_b2b,
      v_config.commission_b2c,
      v_config.price_calculation_mode,
      auth.uid(),
      'Supplier price updated: ' || OLD.price::TEXT || ' -> ' || NEW.price::TEXT
    FROM public.regions r
    WHERE r.is_active = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to supplier_products
DROP TRIGGER IF EXISTS trigger_record_price_change ON public.supplier_products;
CREATE TRIGGER trigger_record_price_change
  AFTER UPDATE OF price ON public.supplier_products
  FOR EACH ROW
  EXECUTE FUNCTION record_price_change();

-- ============================================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.pricing_config IS 'Global pricing configuration: commission rates, calculation modes, rounding rules';
COMMENT ON COLUMN public.pricing_config.commission_b2b IS 'B2B commission rate (0.30 = 30%)';
COMMENT ON COLUMN public.pricing_config.commission_b2c IS 'B2C commission rate (0.50 = 50%)';
COMMENT ON COLUMN public.pricing_config.price_calculation_mode IS 'markup = divide by (1-commission), margin = multiply by (1+commission)';
COMMENT ON COLUMN public.regions.price_multiplier IS 'Regional price multiplier (1.00 = base price, 1.10 = +10%)';

COMMENT ON VIEW public.customer_prices IS 'Single source of truth for all customer-facing prices. Calculates B2B/B2C prices with regional multipliers.';

COMMENT ON FUNCTION public.calculate_cart_prices IS 'Bulk price calculation for cart items. Accepts JSONB array of cart items with product_id, region_id, quantity, variation_ids';

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
-- This migration is NON-BREAKING. It adds new tables and views.
-- Old columns (products.price, region_products.price) remain for now.
-- After verification, they will be deprecated in a follow-up migration.
--
-- NEXT STEPS:
-- 1. Run this migration
-- 2. Verify data integrity with verification script
-- 3. Update frontend to use calculate_product_price() RPC
-- 4. Monitor for 7 days
-- 5. Deprecate old columns in cleanup migration
-- ============================================================================
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
