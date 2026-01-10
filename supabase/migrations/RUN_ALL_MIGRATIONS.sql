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
-- Content from: 20260110200000_pricing_redesign_schema.sql
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
  regional_pricing_mode TEXT NOT NULL DEFAULT 'multiplier' CHECK (regional_pricing_mode IN ('multiplier', 'fixed')),

  -- Rounding settings
  round_to_nearest NUMERIC(10, 2) DEFAULT 0.01 CHECK (round_to_nearest > 0),

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT pricing_config_active_unique UNIQUE (is_active) WHERE is_active = true
);

CREATE INDEX idx_pricing_config_active ON public.pricing_config(is_active) WHERE is_active = true;

CREATE TRIGGER pricing_config_updated_at
  BEFORE UPDATE ON public.pricing_config
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;

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

INSERT INTO public.pricing_config (commission_b2b, commission_b2c, price_calculation_mode, regional_pricing_mode)
VALUES (0.30, 0.50, 'markup', 'multiplier');

-- ============================================================================
-- STEP 2: Regional Price Multipliers
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'regions' AND column_name = 'price_multiplier'
  ) THEN
    ALTER TABLE public.regions ADD COLUMN price_multiplier NUMERIC(5, 4) DEFAULT 1.00 CHECK (price_multiplier > 0);
  END IF;
END $$;

UPDATE public.regions SET price_multiplier = 1.00 WHERE price_multiplier IS NULL;
ALTER TABLE public.regions ALTER COLUMN price_multiplier SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_regions_price_multiplier ON public.regions(price_multiplier);

-- ============================================================================
-- STEP 3: Customer Price Calculation View
-- ============================================================================

DROP VIEW IF EXISTS public.customer_prices CASCADE;

CREATE OR REPLACE VIEW public.customer_prices AS
WITH supplier_base AS (
  SELECT
    sp.product_id,
    sp.supplier_id,
    sp.price as supplier_price,
    sp.price_change,
    sp.availability,
    sp.stock_quantity,
    sp.quality,
    sp.is_featured,
    ROW_NUMBER() OVER (PARTITION BY sp.product_id ORDER BY sp.price ASC) as price_rank
  FROM public.supplier_products sp
  INNER JOIN public.suppliers s ON s.id = sp.supplier_id
  WHERE sp.is_active = true AND s.is_active = true
),
regional_multipliers AS (
  SELECT
    rp.product_id,
    rp.region_id,
    r.price_multiplier,
    rp.price as legacy_region_price,
    rp.business_price as legacy_business_price
  FROM public.region_products rp
  INNER JOIN public.regions r ON r.id = rp.region_id
  WHERE rp.is_active = true
),
config AS (
  SELECT * FROM public.pricing_config WHERE is_active = true LIMIT 1
)
SELECT
  p.id as product_id,
  p.name as product_name,
  p.category,
  p.unit,
  p.images[1] as image_url,
  sb.supplier_id,
  s.name as supplier_name,
  sb.supplier_price,
  sb.price_change,
  sb.availability,
  sb.stock_quantity,
  sb.quality,
  sb.is_featured,
  sb.price_rank,
  rm.region_id,
  r.name as region_name,
  rm.price_multiplier as regional_multiplier,
  CASE
    WHEN config.regional_pricing_mode = 'multiplier' THEN
      CASE config.price_calculation_mode
        WHEN 'markup' THEN ROUND((sb.supplier_price / (1 - config.commission_b2c)) * rm.price_multiplier, 2)
        ELSE ROUND((sb.supplier_price * (1 + config.commission_b2c)) * rm.price_multiplier, 2)
      END
    ELSE COALESCE(rm.legacy_region_price, sb.supplier_price)
  END as b2c_price,
  CASE
    WHEN config.regional_pricing_mode = 'multiplier' THEN
      CASE config.price_calculation_mode
        WHEN 'markup' THEN ROUND((sb.supplier_price / (1 - config.commission_b2b)) * rm.price_multiplier, 2)
        ELSE ROUND((sb.supplier_price * (1 + config.commission_b2b)) * rm.price_multiplier, 2)
      END
    ELSE COALESCE(rm.legacy_business_price, sb.supplier_price)
  END as b2b_price,
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

GRANT SELECT ON public.customer_prices TO authenticated;
GRANT SELECT ON public.customer_prices TO public;

-- ============================================================================
-- STEP 4: Price History Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  supplier_price NUMERIC(10, 2) NOT NULL,
  b2b_price NUMERIC(10, 2),
  b2c_price NUMERIC(10, 2),
  regional_multiplier NUMERIC(5, 4) DEFAULT 1.00,
  commission_rate_b2b NUMERIC(5, 4),
  commission_rate_b2c NUMERIC(5, 4),
  calculation_mode TEXT,
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_history_product ON public.price_history(product_id, recorded_at DESC);
CREATE INDEX idx_price_history_supplier ON public.price_history(supplier_id, recorded_at DESC);
CREATE INDEX idx_price_history_region ON public.price_history(region_id, recorded_at DESC);
CREATE INDEX idx_price_history_recorded_at ON public.price_history(recorded_at DESC);

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

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

COMMENT ON TABLE public.price_history IS 'Historical price tracking for analytics and debugging';

-- ============================================================================
-- STEP 5: Price Calculation RPC Function
-- ============================================================================

DROP FUNCTION IF EXISTS public.calculate_product_price CASCADE;

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
  supplier_price NUMERIC(10, 2),
  variation_adjustment NUMERIC(10, 2),
  regional_multiplier NUMERIC(5, 4),
  commission_rate NUMERIC(5, 4),
  b2b_price NUMERIC(10, 2),
  b2c_price NUMERIC(10, 2),
  final_price NUMERIC(10, 2),
  price_calculation_mode TEXT,
  regional_pricing_mode TEXT,
  calculated_at TIMESTAMPTZ,
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
  SELECT * INTO v_config
  FROM public.pricing_config
  WHERE is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active pricing configuration found';
  END IF;

  v_commission_rate := CASE
    WHEN p_user_role = 'b2b' THEN v_config.commission_b2b
    ELSE v_config.commission_b2c
  END;

  IF p_region_id IS NOT NULL THEN
    SELECT price_multiplier INTO v_regional_multiplier
    FROM public.regions
    WHERE id = p_region_id;
  END IF;

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

  IF p_variation_ids IS NOT NULL AND array_length(p_variation_ids, 1) > 0 THEN
    SELECT COALESCE(SUM(price_adjustment), 0) INTO v_variation_price_adj
    FROM public.supplier_product_variations
    WHERE supplier_product_id IN (
      SELECT id FROM public.supplier_products
      WHERE product_id = p_product_id AND supplier_id = result.supplier_id
    )
    AND variation_id = ANY(p_variation_ids);
  END IF;

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

GRANT EXECUTE ON FUNCTION public.calculate_product_price(UUID, UUID, UUID, TEXT, UUID[]) TO authenticated;

COMMENT ON FUNCTION public.calculate_product_price IS 'Centralized price calculation with B2B/B2C support, regional multipliers, and variation adjustments';

-- ============================================================================
-- STEP 6: Bulk Cart Price Calculation
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_cart_prices(
  p_items JSONB
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

GRANT EXECUTE ON FUNCTION public.calculate_cart_prices(JSONB) TO authenticated;

-- ============================================================================
-- STEP 7: Performance Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_supplier_products_price_ranking
ON public.supplier_products(product_id, is_active, price)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_region_products_region_product
ON public.region_products(region_id, product_id)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_product_variations_product_type
ON public.product_variations(product_id, variation_type);

CREATE INDEX IF NOT EXISTS idx_supplier_product_variations_price_adj
ON public.supplier_product_variations(variation_id)
WHERE price_adjustment != 0;

-- ============================================================================
-- STEP 8: Price History Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION record_price_change()
RETURNS TRIGGER AS $$
DECLARE
  v_config RECORD;
BEGIN
  SELECT * INTO v_config
  FROM public.pricing_config
  WHERE is_active = true
  LIMIT 1;

  IF OLD.price IS DISTINCT FROM NEW.price THEN
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
      CASE v_config.price_calculation_mode
        WHEN 'markup' THEN ROUND(NEW.price / (1 - v_config.commission_b2b) * r.price_multiplier, 2)
        ELSE ROUND(NEW.price * (1 + v_config.commission_b2b) * r.price_multiplier, 2)
      END,
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

DROP TRIGGER IF EXISTS trigger_record_price_change ON public.supplier_products;
CREATE TRIGGER trigger_record_price_change
  AFTER UPDATE OF price ON public.supplier_products
  FOR EACH ROW
  EXECUTE FUNCTION record_price_change();

-- ============================================================================
-- PART 2: DATA MIGRATION
-- Content from: 20260110210000_pricing_redesign_data_migration.sql
-- ============================================================================

-- Pre-migration checks
DO $$
DECLARE
  v_products_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_products_count FROM public.products;
  RAISE NOTICE '=== PRE-MIGRATION CHECK ===';
  RAISE NOTICE 'Products: %', v_products_count;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'pricing_config'
  ) THEN
    RAISE EXCEPTION 'Schema migration must run first';
  END IF;

  RAISE NOTICE 'Pre-migration checks passed';
END $$;

-- Step 1: Calculate regional multipliers
DO $$
DECLARE
  v_region RECORD;
  v_avg_ratio NUMERIC;
  v_supplier_avg NUMERIC;
  v_region_avg NUMERIC;
BEGIN
  RAISE NOTICE '=== Calculating regional multipliers ===';

  FOR v_region IN
    SELECT DISTINCT rp.region_id, r.name
    FROM public.region_products rp
    INNER JOIN public.regions r ON r.id = rp.region_id
    WHERE rp.is_active = true
  LOOP
    SELECT AVG(sp.price) INTO v_supplier_avg
    FROM public.supplier_products sp
    INNER JOIN public.region_products rp ON rp.product_id = sp.product_id
    WHERE rp.region_id = v_region.region_id AND sp.is_active = true;

    SELECT AVG(rp.price) INTO v_region_avg
    FROM public.region_products rp
    WHERE rp.region_id = v_region.region_id AND rp.is_active = true;

    v_avg_ratio := CASE
      WHEN v_supplier_avg > 0 THEN ROUND(v_region_avg / v_supplier_avg, 4)
      ELSE 1.00
    END;

    UPDATE public.regions
    SET price_multiplier = LEAST(GREATEST(v_avg_ratio, 0.80::NUMERIC), 1.50::NUMERIC)
    WHERE id = v_region.region_id;

    RAISE NOTICE 'Region %: multiplier = %', v_region.name, LEAST(GREATEST(v_avg_ratio, 0.80::NUMERIC), 1.50::NUMERIC);
  END LOOP;
END $$;

-- Step 2: Migrate product base prices to supplier_products
DO $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  RAISE NOTICE '=== Migrating product base prices ===';

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
  SET price = mp.new_price, previous_price = sp.price, updated_at = NOW()
  FROM missing_prices mp
  WHERE sp.id = mp.supplier_product_id
    AND (sp.price IS NULL OR sp.price = 0);

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % supplier_products', v_updated_count;
END $$;

-- Step 3: Populate price history
DO $$
DECLARE
  v_config RECORD;
  v_history_count INTEGER;
BEGIN
  RAISE NOTICE '=== Populating price history ===';

  SELECT * INTO v_config
  FROM public.pricing_config
  WHERE is_active = true
  LIMIT 1;

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
    CASE v_config.price_calculation_mode
      WHEN 'markup' THEN ROUND(sp.price / (1 - v_config.commission_b2b) * r.price_multiplier, 2)
      ELSE ROUND(sp.price * (1 + v_config.commission_b2b) * r.price_multiplier, 2)
    END,
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
  WHERE sp.is_active = true AND s.is_active = true AND r.is_active = true;

  GET DIAGNOSTICS v_history_count = ROW_COUNT;
  RAISE NOTICE 'Inserted % price history records', v_history_count;
END $$;

-- Step 4: Validate data integrity
DO $$
DECLARE
  v_orphan_products INTEGER;
  v_zero_prices INTEGER;
BEGIN
  RAISE NOTICE '=== Validating data integrity ===';

  SELECT COUNT(DISTINCT p.id) INTO v_orphan_products
  FROM public.products p
  LEFT JOIN public.supplier_products sp ON sp.product_id = p.id AND sp.is_active = true
  WHERE (p.is_active = true OR p.product_status = 'active') AND sp.id IS NULL;

  IF v_orphan_products > 0 THEN
    RAISE WARNING '% products without suppliers', v_orphan_products;
  END IF;

  SELECT COUNT(*) INTO v_zero_prices
  FROM public.supplier_products
  WHERE is_active = true AND (price IS NULL OR price <= 0);

  IF v_zero_prices > 0 THEN
    RAISE WARNING '% supplier_products with invalid prices', v_zero_prices;
  END IF;

  RAISE NOTICE 'Data integrity validation complete';
END $$;

-- Migration summary
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Products: %', (SELECT COUNT(*) FROM public.products);
  RAISE NOTICE 'Supplier Products: %', (SELECT COUNT(*) FROM public.supplier_products WHERE is_active = true);
  RAISE NOTICE 'Price History Records: %', (SELECT COUNT(*) FROM public.price_history);
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- PART 3: VERIFICATION
-- Content from: 20260110220000_pricing_redesign_verification.sql
-- ============================================================================

-- TEST 1: Schema Verification
DO $$
DECLARE
  v_passed INTEGER := 0;
  v_failed INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== VERIFICATION TESTS ===';

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_config') THEN
    v_passed := v_passed + 1;
    RAISE NOTICE '[PASS] pricing_config table exists';
  ELSE
    v_failed := v_failed + 1;
    RAISE NOTICE '[FAIL] pricing_config table missing';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'price_history') THEN
    v_passed := v_passed + 1;
    RAISE NOTICE '[PASS] price_history table exists';
  ELSE
    v_failed := v_failed + 1;
    RAISE NOTICE '[FAIL] price_history table missing';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'customer_prices') THEN
    v_passed := v_passed + 1;
    RAISE NOTICE '[PASS] customer_prices view exists';
  ELSE
    v_failed := v_failed + 1;
    RAISE NOTICE '[FAIL] customer_prices view missing';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_product_price') THEN
    v_passed := v_passed + 1;
    RAISE NOTICE '[PASS] calculate_product_price function exists';
  ELSE
    v_failed := v_failed + 1;
    RAISE NOTICE '[FAIL] calculate_product_price function missing';
  END IF;

  RAISE NOTICE 'Result: % passed, % failed', v_passed, v_failed;

  IF v_failed > 0 THEN
    RAISE EXCEPTION 'Verification failed with % errors', v_failed;
  END IF;
END $$;

-- TEST 2: Configuration Verification
DO $$
DECLARE
  v_config RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Configuration Verification ===';

  SELECT * INTO v_config
  FROM public.pricing_config
  WHERE is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION '[FAIL] No active pricing configuration found';
  END IF;

  RAISE NOTICE '[PASS] Active config found';
  RAISE NOTICE '  - B2B Commission: %%%', ROUND(v_config.commission_b2b * 100, 2);
  RAISE NOTICE '  - B2C Commission: %%%', ROUND(v_config.commission_b2c * 100, 2);
  RAISE NOTICE '  - Calculation Mode: %', v_config.price_calculation_mode;
END $$;

-- TEST 3: Regional Multiplier Verification
DO $$
DECLARE
  v_region RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Regional Multiplier Verification ===';

  FOR v_region IN
    SELECT id, name, price_multiplier
    FROM public.regions
    WHERE is_active = true
  LOOP
    IF v_region.price_multiplier IS NULL OR v_region.price_multiplier <= 0 THEN
      RAISE NOTICE '[FAIL] Region % has invalid multiplier', v_region.name;
    ELSE
      RAISE NOTICE '[PASS] Region %: %', v_region.name, v_region.price_multiplier;
    END IF;
  END LOOP;
END $$;

-- TEST 4: Price Calculation Test
DO $$
DECLARE
  v_test_product_id UUID;
  v_test_region_id UUID;
  v_price_result RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Price Calculation Test ===';

  SELECT p.id, r.id INTO v_test_product_id, v_test_region_id
  FROM public.products p
  INNER JOIN public.region_products rp ON rp.product_id = p.id
  INNER JOIN public.regions r ON r.id = rp.region_id
  WHERE p.is_active = true AND rp.is_active = true AND r.is_active = true
  LIMIT 1;

  IF v_test_product_id IS NULL THEN
    RAISE NOTICE '[SKIP] No test product found';
    RETURN;
  END IF;

  SELECT * INTO v_price_result
  FROM public.calculate_product_price(v_test_product_id, v_test_region_id, NULL, 'b2c')
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION '[FAIL] calculate_product_price returned no results';
  END IF;

  RAISE NOTICE '[PASS] Price calculation works';
  RAISE NOTICE '  - Product: %', v_price_result.product_name;
  RAISE NOTICE '  - Supplier price: %', v_price_result.supplier_price;
  RAISE NOTICE '  - B2B: % | B2C: %', v_price_result.b2b_price, v_price_result.b2c_price;
END $$;

-- FINAL SUMMARY
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ALL MIGRATIONS COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Review verification results above';
  RAISE NOTICE '2. Test calculate_product_price() function';
  RAISE NOTICE '3. Update frontend to use new pricing RPC';
  RAISE NOTICE '4. Monitor for 7 days before cleanup';
  RAISE NOTICE '';
  RAISE NOTICE 'To rollback, run: supabase/migrations/20260110290000_pricing_redesign_rollback.sql';
  RAISE NOTICE '========================================';
END $$;
