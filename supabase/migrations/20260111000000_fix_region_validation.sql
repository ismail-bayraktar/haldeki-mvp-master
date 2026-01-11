-- ============================================================================
-- Fix Region Validation in calculate_product_price Function
-- Date: 2026-01-11
-- Author: Database Architect
-- Purpose: Add region validation to prevent products showing for inactive/invalid regions
--
-- PROBLEM: Products show in admin panel but not on website because:
-- 1. Region doesn't exist or is inactive
-- 2. Product doesn't exist in region_products for that region
--
-- SOLUTION: Add validation inside calculate_product_price function
-- ============================================================================

-- ============================================================================
-- STEP 1: Recreate calculate_product_price with region validation
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_product_price(
  p_product_id UUID,
  p_region_id UUID DEFAULT NULL,
  p_supplier_id UUID DEFAULT NULL,
  p_user_role TEXT DEFAULT 'b2c',
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
  v_region_exists BOOLEAN;
  v_region_active BOOLEAN;
  v_product_in_region BOOLEAN;
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

  -- ========================================================================
  -- REGION VALIDATION (The fix)
  -- ========================================================================
  IF p_region_id IS NOT NULL THEN
    -- Check if region exists
    SELECT EXISTS(
      SELECT 1 FROM public.regions WHERE id = p_region_id
    ) INTO v_region_exists;

    IF NOT v_region_exists THEN
      RAISE EXCEPTION 'Region % does not exist', p_region_id;
    END IF;

    -- Check if region is active
    SELECT is_active INTO v_region_active
    FROM public.regions
    WHERE id = p_region_id;

    IF NOT v_region_active THEN
      RAISE EXCEPTION 'Region % is not active', p_region_id;
    END IF;

    -- Check if product exists in region_products
    SELECT EXISTS(
      SELECT 1 FROM public.region_products
      WHERE product_id = p_product_id
        AND region_id = p_region_id
        AND is_active = true
    ) INTO v_product_in_region;

    IF NOT v_product_in_region THEN
      RAISE EXCEPTION 'Product % is not available in region %', p_product_id, p_region_id
      USING ERRCODE = '41004'; -- Custom error code for "product not in region"
    END IF;

    -- Get regional multiplier
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
COMMENT ON FUNCTION public.calculate_product_price IS 'Centralized price calculation with B2B/B2C support, regional multipliers, variation adjustments, and region validation';

-- ============================================================================
-- STEP 2: Add helpful view for debugging region-product availability
-- ============================================================================

CREATE OR REPLACE VIEW public.region_product_availability AS
SELECT
  p.id as product_id,
  p.name as product_name,
  r.id as region_id,
  r.name as region_name,
  r.is_active as region_is_active,
  rp.id as region_product_id,
  rp.is_active as region_product_is_active,
  CASE
    WHEN r.is_active = false THEN 'Region inactive'
    WHEN rp.id IS NULL THEN 'Product not in region'
    WHEN rp.is_active = false THEN 'Region product inactive'
    ELSE 'Available'
  END as availability_status,
  sp.supplier_id,
  s.name as supplier_name,
  sp.price as supplier_price,
  sp.is_active as supplier_product_is_active
FROM public.products p
CROSS JOIN public.regions r
LEFT JOIN public.region_products rp ON rp.product_id = p.id AND rp.region_id = r.id
LEFT JOIN public.supplier_products sp ON sp.product_id = p.id
LEFT JOIN public.suppliers s ON s.id = sp.supplier_id
WHERE p.is_active = true OR p.product_status = 'active';

COMMENT ON VIEW public.region_product_availability IS 'Debug view showing which products are available in which regions';

-- Grant access
GRANT SELECT ON public.region_product_availability TO authenticated;
GRANT SELECT ON public.region_product_availability TO public;

-- ============================================================================
-- STEP 3: Create helper function to check if product is available in region
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_product_available_in_region(
  p_product_id UUID,
  p_region_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_region_active BOOLEAN;
  v_product_in_region BOOLEAN;
BEGIN
  -- Check if region exists and is active
  SELECT is_active INTO v_region_active
  FROM public.regions
  WHERE id = p_region_id;

  IF NOT FOUND OR NOT v_region_active THEN
    RETURN false;
  END IF;

  -- Check if product exists in region_products
  SELECT EXISTS(
    SELECT 1 FROM public.region_products
    WHERE product_id = p_product_id
      AND region_id = p_region_id
      AND is_active = true
  ) INTO v_product_in_region;

  RETURN v_product_in_region;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_product_available_in_region(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.is_product_available_in_region IS 'Check if a product is available in a specific region';

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
-- This migration fixes the issue where products show in admin but not on website
-- by adding proper region validation inside the calculate_product_price function.
--
-- VALIDATION ADDED:
-- 1. Check if region exists
-- 2. Check if region is active (regions.is_active = true)
-- 3. Check if product exists in region_products (region_products.is_active = true)
--
-- USAGE:
-- Use the region_product_availability view to debug which products are
-- available in which regions.
--
-- Use is_product_available_in_region() to check availability before calling
-- calculate_product_price().
-- ============================================================================
