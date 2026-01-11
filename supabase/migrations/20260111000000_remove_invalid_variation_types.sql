-- ============================================================================
-- Migration: Remove Invalid Variation Types for Fresh Food Market
-- Date: 2026-01-11
-- Author: System Architecture Cleanup
-- ============================================================================

-- Purpose:
-- Remove variation types that are inappropriate for a fresh food market:
-- - "beden" (Turkish for "size" - clothing term) - if exists
-- - "type" with color values (BEYAZ, RENKLI, etc.) - inappropriate for produce
-- - "scent" (LAVANTA, LIMON) - fragrance irrelevant for fresh produce
-- - "material" (CAM, PLASTIK, METAL) - packaging material, not product variation
-- - "flavor" (VANILLA, ÇİKOLATA) - for processed foods, not fresh produce
--
-- Valid types for fresh food market:
-- - size (Boyut): 1 KG, 2 KG, 500 GR, 4 LT
-- - packaging (Ambalaj): Kasa, Koli, Poset, *4 (4-pack)
-- - quality (Kalite): 1. Sınıf, 2. Sınıf, Premium
-- - other (Diğer): Custom variations

-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Step 1: Delete Invalid Variation Data
-- ----------------------------------------------------------------------------

-- 1a. Delete variations with types inappropriate for fresh food market
-- scent, material, flavor are designed for non-food products
DELETE FROM public.product_variations
WHERE variation_type IN ('scent', 'material', 'flavor');

-- 1b. Delete "type" variations with inappropriate color-based values
-- Colors like BEYAZ (white), RENKLI (colored) make no sense for fresh produce
DELETE FROM public.product_variations
WHERE variation_type = 'type'
  AND (
    variation_value ILIKE '%BEYAZ%'
    OR variation_value ILIKE '%RENK%'
    OR variation_value ILIKE '%SİYAH%'
    OR variation_value ILIKE '%KIRMIZI%'
    OR variation_value ILIKE '%MAVİ%'
    OR variation_value ILIKE '%YEŞİL%'
    OR variation_value ILIKE '%SARI%'
  );

-- 1c. Delete any "beden" variations if they exist
-- "beden" is Turkish for clothing size, should not be in fresh food market
-- This is a safety check - data may exist from before CHECK constraint
DELETE FROM public.product_variations
WHERE variation_type ILIKE '%beden%';

-- 1d. Delete remaining "type" variations
-- "type" is too generic and often misused for colors
-- Valid types should use specific: size, packaging, quality, or other
DELETE FROM public.product_variations
WHERE variation_type = 'type';

-- ----------------------------------------------------------------------------
-- Step 2: Update CHECK Constraint
-- ----------------------------------------------------------------------------

-- 2a. Drop the old CHECK constraint
ALTER TABLE public.product_variations
DROP CONSTRAINT IF EXISTS product_variations_variation_type_check;

-- 2b. Add new CHECK constraint with only valid types for fresh food
ALTER TABLE public.product_variations
ADD CONSTRAINT product_variations_variation_type_check
CHECK (variation_type IN ('size', 'packaging', 'quality', 'other'));

-- ----------------------------------------------------------------------------
-- Step 3: Update Comments
-- ----------------------------------------------------------------------------

COMMENT ON TABLE public.product_variations IS
'Product variations for fresh food market. Valid types: size (Boyut: 1 KG, 2 KG, 500 GR), packaging (Ambalaj: Kasa, Koli, Poset, *4), quality (Kalite: 1. Sınıf, Premium), other (Diğer: custom variations).';

COMMENT ON COLUMN public.product_variations.variation_type IS
'Variation type: size = weight/volume (1 KG, 500 GR), packaging = container (Kasa, Koli), quality = grade (1. Sınıf, Premium), other = custom values';

COMMENT ON COLUMN public.product_variations.variation_value IS
'Human-readable variation value. Examples: "1 KG", "2 KG", "Kasa", "1. Sınıf", "Organik"';

-- ----------------------------------------------------------------------------
-- Step 4: Verification Queries
-- ----------------------------------------------------------------------------

-- Verify cleanup - should only show valid types
DO $$
DECLARE
  v_invalid_count INTEGER;
  v_valid_types TEXT[];
BEGIN
  -- Check for any remaining invalid types
  SELECT COUNT(DISTINCT variation_type) INTO v_invalid_count
  FROM public.product_variations
  WHERE variation_type NOT IN ('size', 'packaging', 'quality', 'other');

  IF v_invalid_count > 0 THEN
    RAISE WARNING 'Found % variations with invalid types after cleanup!', v_invalid_count;
  END IF;

  -- Show current type distribution
  SELECT ARRAY_AGG(variation_type ORDER BY variation_type) INTO v_valid_types
  FROM (
    SELECT DISTINCT variation_type
    FROM public.product_variations
  ) t;

  RAISE NOTICE 'Current variation types in database: %', v_valid_types;
END $$;

-- ----------------------------------------------------------------------------
-- Step 5: Update Indexes (if needed)
-- ----------------------------------------------------------------------------

-- Recreate index for faster queries on variation_type
DROP INDEX IF EXISTS public.idx_product_variations_type;
CREATE INDEX idx_product_variations_type ON public.product_variations(variation_type);

COMMIT;

-- ============================================================================
-- Rollback Instructions (if needed)
-- ============================================================================
/*
To rollback this migration:

1. Restore CHECK constraint to include all types:
ALTER TABLE public.product_variations
DROP CONSTRAINT product_variations_variation_type_check;

ALTER TABLE public.product_variations
ADD CONSTRAINT product_variations_variation_type_check
CHECK (variation_type IN ('size', 'type', 'scent', 'packaging', 'material', 'flavor', 'other'));

2. Restore data from backup (if you have one):
psql -f backups/product_variations_before_cleanup.sql

3. Or re-insert deleted data if you have it logged.
*/

-- ============================================================================
-- Verification Query (run after migration to confirm)
-- ============================================================================
/*
-- Run this to verify cleanup worked correctly:

SELECT
  variation_type,
  COUNT(*) AS variation_count,
  COUNT(DISTINCT product_id) AS product_count
FROM public.product_variations
GROUP BY variation_type
ORDER BY variation_type;

-- Expected result should only show: size, packaging, quality, other
*/
