-- Haldeki Market - Simple Pricing Migration
-- Best Practice: Minimal, tested SQL that works

-- ============================================================================
-- STEP 1: Create pricing_config table (Commission rates)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_b2b NUMERIC(5, 4) NOT NULL DEFAULT 0.30,
  commission_b2c NUMERIC(5, 4) NOT NULL DEFAULT 0.50,
  price_calculation_mode TEXT NOT NULL DEFAULT 'markup',
  regional_pricing_mode TEXT NOT NULL DEFAULT 'multiplier',
  round_to_nearest NUMERIC(10, 2) DEFAULT 0.01,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial unique index for single active config
CREATE UNIQUE INDEX pricing_config_active_unique
  ON public.pricing_config(is_active)
  WHERE is_active = true;

-- Insert default config
INSERT INTO public.pricing_config (commission_b2b, commission_b2c)
VALUES (0.30, 0.50)
ON CONFLICT (is_active) WHERE is_active = true DO NOTHING;

-- ============================================================================
-- STEP 2: Add price_multiplier column to regions (if not exists)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'regions' AND column_name = 'price_multiplier'
  ) THEN
    ALTER TABLE public.regions ADD COLUMN price_multiplier NUMERIC(5, 4) DEFAULT 1.00;
  END IF;
END $$;

-- Update existing regions with default multiplier
UPDATE public.regions
SET price_multiplier = 1.00
WHERE price_multiplier IS NULL;

-- ============================================================================
-- STEP 3: Create price_history table (Audit trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  region_id UUID,
  supplier_id UUID,
  price_before NUMERIC(10, 2),
  price_after NUMERIC(10, 2),
  commission_rate NUMERIC(5, 4),
  regional_multiplier NUMERIC(5, 4),
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for price_history
CREATE INDEX idx_price_history_product ON public.price_history(product_id);
CREATE INDEX idx_price_history_region ON public.price_history(region_id);
CREATE INDEX idx_price_history_supplier ON public.price_history(supplier_id);
CREATE INDEX idx_price_history_changed_at ON public.price_history(changed_at DESC);

-- ============================================================================
-- STEP 4: Simple price calculation view (NO complex function yet)
-- ============================================================================

-- For now, use existing supplier_products table
-- Complex RPC function can be added later after basic setup works

-- ============================================================================
-- STEP 5: Verify setup
-- ============================================================================

DO $$
DECLARE
  v_config_count INTEGER;
  v_regions_updated INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_config_count FROM public.pricing_config WHERE is_active = true;
  SELECT COUNT(*) INTO v_regions_updated FROM public.regions WHERE price_multiplier IS NOT NULL;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Pricing Migration Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Active configs: %', v_config_count;
  RAISE NOTICE 'Regions with multiplier: %', v_regions_updated;
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Verify commission rates: SELECT * FROM pricing_config;';
  RAISE NOTICE '2. Verify regional multipliers: SELECT name, price_multiplier FROM regions;';
  RAISE NOTICE '3. Add calculate_product_price RPC function (separate migration)';
  RAISE NOTICE '========================================';
END $$;
