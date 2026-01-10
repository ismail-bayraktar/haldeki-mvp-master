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
  v_variation_price_adj NUMERIC(10, 2) DEFAULT 0;
  v_regional_multiplier NUMERIC(5, 4) DEFAULT 1.00;
  v_commission_rate NUMERIC(5, 4);
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
  INTO v_supplier_price, result.supplier_id, result.supplier_name,
       result.availability, result.stock_quantity, result.is_featured, result.price_rank
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
      WHERE product_id = p_product_id AND supplier_id = result.supplier_id
    )
    AND variation_id = ANY(p_variation_ids);
  END IF;

  -- Calculate final prices
  result.b2b_price := CASE
    WHEN v_config.price_calculation_mode = 'markup' THEN
      ROUND((v_supplier_price + v_variation_price_adj) / (1 - v_config.commission_b2b) * v_regional_multiplier, 2)
    ELSE
      ROUND((v_supplier_price + v_variation_price_adj) * (1 + v_config.commission_b2b) * v_regional_multiplier, 2)
  END;

  result.b2c_price := CASE
    WHEN v_config.price_calculation_mode = 'markup' THEN
      ROUND((v_supplier_price + v_variation_price_adj) / (1 - v_config.commission_b2c) * v_regional_multiplier, 2)
    ELSE
      ROUND((v_supplier_price + v_variation_price_adj) * (1 + v_config.commission_b2c) * v_regional_multiplier, 2)
  END;

  result.final_price := CASE
    WHEN p_user_role = 'b2b' THEN result.b2b_price
    ELSE result.b2c_price
  END;

  -- Return result set
  RETURN QUERY
  SELECT
    p_product_id,
    p.name,
    result.supplier_id,
    result.supplier_name,
    p_region_id,
    (SELECT name FROM public.regions WHERE id = p_region_id),

    v_supplier_price,
    v_variation_price_adj,
    v_regional_multiplier,
    v_commission_rate,

    result.b2b_price,
    result.b2c_price,
    result.final_price,

    v_config.price_calculation_mode,
    v_config.regional_pricing_mode,
    NOW(),

    result.availability,
    result.stock_quantity,
    result.is_featured,
    result.price_rank

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
