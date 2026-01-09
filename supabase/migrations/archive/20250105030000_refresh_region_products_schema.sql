-- ============================================================================
-- Refresh Region Products Schema
-- ============================================================================
-- This migration refreshes the PostgREST schema cache for region_products table

-- Verify is_active column exists (should already exist from initial migration)
DO $$
BEGIN
  -- Check if column exists, add if missing
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'region_products'
      AND table_schema = 'public'
      AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.region_products ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    RAISE NOTICE 'Added is_active column to region_products';
  ELSE
    RAISE NOTICE 'is_active column already exists in region_products';
  END IF;
END $$;

-- Recreate the index to force schema cache refresh
DROP INDEX IF EXISTS public.idx_region_products_active;
CREATE INDEX idx_region_products_active ON public.region_products(is_active) WHERE is_active = true;

-- Verify all required columns exist
DO $$
DECLARE
  missing_columns TEXT[];
BEGIN
  -- Check for required columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'region_products' AND column_name = 'region_id') THEN
    missing_columns := array_append(missing_columns, 'region_id');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'region_products' AND column_name = 'product_id') THEN
    missing_columns := array_append(missing_columns, 'product_id');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'region_products' AND column_name = 'price') THEN
    missing_columns := array_append(missing_columns, 'price');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'region_products' AND column_name = 'is_active') THEN
    missing_columns := array_append(missing_columns, 'is_active');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'region_products' AND column_name = 'business_price') THEN
    missing_columns := array_append(missing_columns, 'business_price');
  END IF;

  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'Missing columns in region_products: %', missing_columns;
  ELSE
    RAISE NOTICE 'All required columns exist in region_products';
  END IF;
END $$;
