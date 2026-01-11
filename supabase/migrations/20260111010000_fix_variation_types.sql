-- ============================================================================
-- Migration: Fix Variation Types for Fresh Food Market
-- Date: 2026-01-11
-- Description:
--   1. Backup existing product_variations data
--   2. Clean invalid variation data (beden, type: BEYAZ entries)
--   3. Add new 'quality' enum value for food market
--   4. Migrate existing data to appropriate food-related types
--
-- NOTE: PostgreSQL ENUM values cannot be removed. Old values (type, scent,
--       material, flavor) remain in enum but will not be used for new data.
--       Application layer should enforce using only: size, packaging, quality, other
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Create backup table
-- ============================================================================

DROP TABLE IF EXISTS public.product_variations_backup_20260111;

CREATE TABLE public.product_variations_backup_20260111 AS
SELECT * FROM public.product_variations;

-- Log backup count
DO $$
DECLARE
  backup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO backup_count FROM public.product_variations_backup_20260111;
  RAISE NOTICE 'Backed up % product_variations records', backup_count;
END $$;

-- ============================================================================
-- STEP 2: Clean invalid data entries
-- ============================================================================

-- Log pre-cleanup state
DO $$
DECLARE
  pre_count INTEGER;
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO pre_count FROM public.product_variations;

  SELECT COUNT(*) INTO invalid_count
  FROM public.product_variations
  WHERE variation_type::TEXT NOT IN (
    'size', 'type', 'scent', 'packaging', 'material', 'flavor', 'other'
  );

  RAISE NOTICE 'Pre-cleanup: % total, % invalid entries', pre_count, invalid_count;
END $$;

-- Delete variations with invalid types (e.g., "beden")
DELETE FROM public.product_variations
WHERE variation_type::TEXT NOT IN (
  'size', 'type', 'scent', 'packaging', 'material', 'flavor', 'other'
);

-- Delete variations with "type: BEYAZ" pattern in variation_value
DELETE FROM public.product_variations
WHERE variation_type = 'type' AND variation_value LIKE '%BEYAZ%';

-- Log cleanup results
DO $$
DECLARE
  deleted_count INTEGER;
  remaining_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  SELECT COUNT(*) INTO remaining_count FROM public.product_variations;
  RAISE NOTICE 'Deleted invalid records. Remaining: %', remaining_count;
END $$;

-- ============================================================================
-- STEP 3: Add new 'quality' enum value for food market
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'quality'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'product_variation_type')
  ) THEN
    ALTER TYPE public.product_variation_type ADD VALUE 'quality' BEFORE 'other';
    RAISE NOTICE 'Added quality enum value';
  ELSE
    RAISE NOTICE 'Quality enum value already exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Migrate existing data to food-appropriate types
-- ============================================================================

-- Map 'scent' variations to 'quality' (for aromatic products like herbs, spices)
UPDATE public.product_variations
SET variation_type = 'quality'::product_variation_type
WHERE variation_type = 'scent';

DO $$
DECLARE
  migrated_scent INTEGER;
BEGIN
  GET DIAGNOSTICS migrated_scent = ROW_COUNT;
  RAISE NOTICE 'Migrated % scent entries to quality', migrated_scent;
END $$;

-- Map 'material' variations to 'packaging' (packaging material)
UPDATE public.product_variations
SET variation_type = 'packaging'::product_variation_type
WHERE variation_type = 'material';

DO $$
DECLARE
  migrated_material INTEGER;
BEGIN
  GET DIAGNOSTICS migrated_material = ROW_COUNT;
  RAISE NOTICE 'Migrated % material entries to packaging', migrated_material;
END $$;

-- Map 'flavor' variations to 'other'
UPDATE public.product_variations
SET variation_type = 'other'::product_variation_type
WHERE variation_type = 'flavor';

DO $$
DECLARE
  migrated_flavor INTEGER;
BEGIN
  GET DIAGNOSTICS migrated_flavor = ROW_COUNT;
  RAISE NOTICE 'Migrated % flavor entries to other', migrated_flavor;
END $$;

-- Map remaining 'type' variations to appropriate categories
-- For food products, 'type' often means quality or other attribute
UPDATE public.product_variations
SET variation_type = 'other'::product_variation_type
WHERE variation_type = 'type';

DO $$
DECLARE
  migrated_type INTEGER;
BEGIN
  GET DIAGNOSTICS migrated_type = ROW_COUNT;
  RAISE NOTICE 'Migrated % type entries to other', migrated_type;
END $$;

-- ============================================================================
-- STEP 5: Update comments for food market context
-- ============================================================================

COMMENT ON TYPE public.product_variation_type IS '
Food market product variation types:
- size: Boyut (1 KG, 2 KG, 5 KG, 500 GR)
- packaging: Ambalaj (Kasa, Koli, Poşet)
- quality: Kalite (1. Sınıf, 2. Sınıf, Organik)
- other: Diğer variations

LEGACY (deprecated, do not use):
- type: Deprecated - use quality or other
- scent: Deprecated - use quality
- material: Deprecated - use packaging
- flavor: Deprecated - use other
';

COMMENT ON COLUMN public.product_variations.variation_type IS '
Type of variation for fresh food products.
Recommended values: size, packaging, quality, other
';

COMMENT ON TABLE public.product_variations IS '
Product variations for fresh food market.
Size: product weight/volume (1 KG, 2 KG)
Packaging: packaging type (Kasa, Koli)
Quality: quality grade (1. Sınıf, 2. Sınıf, Organik)
Other: any other variation
';

-- ============================================================================
-- STEP 6: Verify data integrity
-- ============================================================================

DO $$
DECLARE
  total_variations INTEGER;
  by_size INTEGER;
  by_packaging INTEGER;
  by_quality INTEGER;
  by_other INTEGER;
  by_deprecated INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_variations FROM public.product_variations;

  SELECT COUNT(*) INTO by_size
  FROM public.product_variations WHERE variation_type = 'size';

  SELECT COUNT(*) INTO by_packaging
  FROM public.product_variations WHERE variation_type = 'packaging';

  SELECT COUNT(*) INTO by_quality
  FROM public.product_variations WHERE variation_type = 'quality';

  SELECT COUNT(*) INTO by_other
  FROM public.product_variations WHERE variation_type = 'other';

  SELECT COUNT(*) INTO by_deprecated
  FROM public.product_variations
  WHERE variation_type::TEXT IN ('type', 'scent', 'material', 'flavor');

  RAISE NOTICE '=== Final Variation Type Summary ===';
  RAISE NOTICE 'Total variations: %', total_variations;
  RAISE NOTICE '  size: %', by_size;
  RAISE NOTICE '  packaging: %', by_packaging;
  RAISE NOTICE '  quality: %', by_quality;
  RAISE NOTICE '  other: %', by_other;
  RAISE NOTICE '  deprecated (should be 0): %', by_deprecated;
END $$;

COMMIT;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- To rollback this migration, execute:
--
-- BEGIN;
--
-- -- Restore from backup
-- TRUNCATE TABLE public.product_variations;
-- INSERT INTO public.product_variations SELECT * FROM public.product_variations_backup_20260111;
--
-- -- Optionally drop backup after successful rollback
-- -- DROP TABLE IF EXISTS public.product_variations_backup_20260111;
--
-- COMMIT;
--
-- NOTE: The 'quality' enum value cannot be removed from PostgreSQL ENUM.
--       If full rollback is needed, you must recreate the entire ENUM type.
-- ============================================================================
