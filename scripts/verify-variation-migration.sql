-- ============================================================================
-- Variation Migration Verification Script
-- ============================================================================
-- Purpose: Automated verification of variation types cleanup migration
-- Usage: psql -f scripts/verify-variation-migration.sql
-- ============================================================================

\echo '================================================================================'
\echo 'VARIATION MIGRATION VERIFICATION'
\echo '================================================================================'
\echo ''

-- ----------------------------------------------------------------------------
-- 1. Pre-Migration Snapshot (Optional - run before migration)
-- ----------------------------------------------------------------------------
\echo '--- 1. CURRENT VARIATION TYPES DISTRIBUTION ---'
\echo ''

SELECT
  variation_type,
  COUNT(*) AS variation_count,
  COUNT(DISTINCT product_id) AS product_count,
  STRING_AGG(DISTINCT variation_value, ', ') AS sample_values
FROM public.product_variations
GROUP BY variation_type
ORDER BY variation_type;

\echo ''
\echo '================================================================================'
\echo ''

-- ----------------------------------------------------------------------------
-- 2. Backup Verification
-- ----------------------------------------------------------------------------
\echo '--- 2. BACKUP TABLE VERIFICATION ---'
\echo ''

DO $$
DECLARE
  backup_exists BOOLEAN;
  backup_count INTEGER;
  current_count INTEGER;
BEGIN
  -- Check if backup table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'product_variations_backup_20260111'
  ) INTO backup_exists;

  IF backup_exists THEN
    EXECUTE 'SELECT COUNT(*) FROM public.product_variations_backup_20260111' INTO backup_count;
    RAISE NOTICE '✓ Backup table exists: product_variations_backup_20260111';
    RAISE NOTICE '  Backup count: %', backup_count;
  ELSE
    RAISE NOTICE '✗ Backup table NOT found (run migration first)';
  END IF;

  -- Get current count
  SELECT COUNT(*) INTO current_count FROM public.product_variations;
  RAISE NOTICE '  Current count: %', current_count;

  IF backup_exists AND backup_count = current_count THEN
    RAISE NOTICE '✓ Backup count matches current count';
  ELSIF backup_exists THEN
    RAISE NOTICE '⚠ Warning: Backup count (%) differs from current count (%)', backup_count, current_count;
  END IF;
END $$;

\echo ''
\echo '================================================================================'
\echo ''

-- ----------------------------------------------------------------------------
-- 3. Invalid Types Check (CRITICAL)
-- ----------------------------------------------------------------------------
\echo '--- 3. INVALID TYPES CHECK (CRITICAL) ---'
\echo ''

DO $$
DECLARE
  invalid_count INTEGER;
  invalid_types TEXT[];
BEGIN
  -- Check for invalid types
  SELECT
    COUNT(*),
    ARRAY_AGG(DISTINCT variation_type ORDER BY variation_type)
  INTO invalid_count, invalid_types
  FROM public.product_variations
  WHERE variation_type NOT IN ('size', 'packaging', 'quality', 'other');

  IF invalid_count = 0 THEN
    RAISE NOTICE '✓ PASS: No invalid variation types found';
  ELSE
    RAISE NOTICE '✗ FAIL: Found % variations with invalid types!', invalid_count;
    RAISE NOTICE '  Invalid types found: %', invalid_types;
  END IF;
END $$;

\echo ''
\echo 'Expected Result: 0 invalid types (only size, packaging, quality, other allowed)'
\echo ''
\echo '================================================================================'
\echo ''

-- ----------------------------------------------------------------------------
-- 4. Valid Types Distribution
-- ----------------------------------------------------------------------------
\echo '--- 4. VALID TYPES DISTRIBUTION ---'
\echo ''

SELECT
  variation_type,
  COUNT(*) AS variation_count,
  COUNT(DISTINCT product_id) AS product_count,
  STRING_AGG(DISTINCT variation_value, ', ' ORDER BY variation_value) AS sample_values
FROM public.product_variations
WHERE variation_type IN ('size', 'packaging', 'quality', 'other')
GROUP BY variation_type
ORDER BY variation_type;

\echo ''
\echo '================================================================================'
\echo ''

-- ----------------------------------------------------------------------------
-- 5. Quality Enum Check
-- ----------------------------------------------------------------------------
\echo '--- 5. QUALITY ENUM VALUE CHECK ---'
\echo ''

DO $$
DECLARE
  quality_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'quality'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'product_variation_type')
  ) INTO quality_exists;

  IF quality_exists THEN
    RAISE NOTICE '✓ PASS: Quality enum value exists';
  ELSE
    RAISE NOTICE '✗ FAIL: Quality enum value NOT found';
  END IF;
END $$;

\echo ''
\echo '================================================================================'
\echo ''

-- ----------------------------------------------------------------------------
-- 6. CHECK Constraint Verification
-- ----------------------------------------------------------------------------
\echo '--- 6. CHECK CONSTRAINT VERIFICATION ---'
\echo ''

DO $$
DECLARE
  constraint_def TEXT;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO constraint_def
  FROM pg_constraint
  WHERE conrelid = 'public.product_variations'::regclass
  AND conname = 'product_variations_variation_type_check';

  IF constraint_def IS NOT NULL THEN
    RAISE NOTICE 'Constraint definition:';
    RAISE NOTICE '  %', constraint_def;

    IF constraint_def LIKE '%size%' AND
       constraint_def LIKE '%packaging%' AND
       constraint_def LIKE '%quality%' AND
       constraint_def LIKE '%other%' THEN
      RAISE NOTICE '✓ PASS: Constraint includes all valid types';
    ELSE
      RAISE NOTICE '✗ FAIL: Constraint missing required types';
    END IF;

    -- Check for invalid types in constraint
    IF constraint_def LIKE '%type,%' OR
       constraint_def LIKE '%scent%' OR
       constraint_def LIKE '%material%' OR
       constraint_def LIKE '%flavor%' OR
       constraint_def LIKE '%beden%' THEN
      RAISE NOTICE '✗ FAIL: Constraint contains deprecated types';
    ELSE
      RAISE NOTICE '✓ PASS: Constraint does not contain deprecated types';
    END IF;
  ELSE
    RAISE NOTICE '✗ FAIL: Constraint not found';
  END IF;
END $$;

\echo ''
\echo '================================================================================'
\echo ''

-- ----------------------------------------------------------------------------
-- 7. Products with No Variations
-- ----------------------------------------------------------------------------
\echo '--- 7. PRODUCTS WITH NO VARIATIONS ---'
\echo ''

SELECT
  COUNT(*) AS product_count_without_variations
FROM public.products p
LEFT JOIN public.product_variations pv ON p.id = pv.product_id
WHERE pv.id IS NULL;

\echo ''
\echo '(This is informational - products may not have variations)'
\echo ''
\echo '================================================================================'
\echo ''

-- ----------------------------------------------------------------------------
-- 8. Sample Variation Values by Type
-- ----------------------------------------------------------------------------
\echo '--- 8. SAMPLE VARIATION VALUES BY TYPE ---'
\echo ''

\echo 'SIZE variations (Boyut):'
SELECT
  variation_value,
  COUNT(*) AS count
FROM public.product_variations
WHERE variation_type = 'size'
GROUP BY variation_value
ORDER BY count DESC
LIMIT 10;

\echo ''
\echo 'PACKAGING variations (Ambalaj):'
SELECT
  variation_value,
  COUNT(*) AS count
FROM public.product_variations
WHERE variation_type = 'packaging'
GROUP BY variation_value
ORDER BY count DESC
LIMIT 10;

\echo ''
\echo 'QUALITY variations (Kalite):'
SELECT
  variation_value,
  COUNT(*) AS count
FROM public.product_variations
WHERE variation_type = 'quality'
GROUP BY variation_value
ORDER BY count DESC
LIMIT 10;

\echo ''
\echo 'OTHER variations (Diğer):'
SELECT
  variation_value,
  COUNT(*) AS count
FROM public.product_variations
WHERE variation_type = 'other'
GROUP BY variation_value
ORDER BY count DESC
LIMIT 10;

\echo ''
\echo '================================================================================'
\echo ''

-- ----------------------------------------------------------------------------
-- 9. Index Check
-- ----------------------------------------------------------------------------
\echo '--- 9. INDEX VERIFICATION ---'
\echo ''

DO $$
DECLARE
  index_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'product_variations'
    AND schemaname = 'public'
    AND indexname LIKE '%variation_type%'
  ) INTO index_exists;

  IF index_exists THEN
    RAISE NOTICE '✓ PASS: Index on variation_type exists';
  ELSE
    RAISE NOTICE '⚠ Warning: No index found on variation_type';
  END IF;
END $$;

\echo ''
\echo '================================================================================'
\echo ''

-- ----------------------------------------------------------------------------
-- 10. Data Integrity Checks
-- ----------------------------------------------------------------------------
\echo '--- 10. DATA INTEGRITY CHECKS ---'
\echo ''

\echo 'Orphaned variations (without products):'
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM public.product_variations pv
  LEFT JOIN public.products p ON pv.product_id = p.id
  WHERE p.id IS NULL;

  IF orphan_count = 0 THEN
    RAISE NOTICE '✓ PASS: No orphaned variations';
  ELSE
    RAISE NOTICE '✗ FAIL: Found % orphaned variations', orphan_count;
  END IF;
END $$;

\echo ''
\echo 'Duplicate display_order values:'
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT
      product_id,
      variation_type,
      display_order,
      COUNT(*) as cnt
    FROM public.product_variations
    GROUP BY product_id, variation_type, display_order
    HAVING COUNT(*) > 1
  ) dups;

  IF duplicate_count = 0 THEN
    RAISE NOTICE '✓ PASS: No duplicate display_order values';
  ELSE
    RAISE NOTICE '✗ FAIL: Found % duplicate display_order combinations', duplicate_count;
  END IF;
END $$;

\echo ''
\echo '================================================================================'
\echo ''

-- ----------------------------------------------------------------------------
-- FINAL SUMMARY
-- ----------------------------------------------------------------------------
\echo '--- VERIFICATION SUMMARY ---'
\echo ''

DO $$
DECLARE
  total_variations INTEGER;
  valid_variations INTEGER;
  invalid_variations INTEGER;
  type_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_variations FROM public.product_variations;
  SELECT COUNT(*) INTO valid_variations FROM public.product_variations WHERE variation_type IN ('size', 'packaging', 'quality', 'other');
  SELECT COUNT(*) INTO invalid_variations FROM public.product_variations WHERE variation_type NOT IN ('size', 'packaging', 'quality', 'other');
  SELECT COUNT(DISTINCT variation_type) INTO type_count FROM public.product_variations;

  RAISE NOTICE 'Total variations: %', total_variations;
  RAISE NOTICE 'Valid variations: %', valid_variations;
  RAISE NOTICE 'Invalid variations: %', invalid_variations;
  RAISE NOTICE 'Distinct types: %', type_count;

  IF invalid_variations = 0 AND type_count <= 4 THEN
    RAISE NOTICE '';
    RAISE NOTICE '✓✓✓ MIGRATION SUCCESSFUL ✓✓✓';
    RAISE NOTICE 'All variation types are valid!';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '✗✗✗ MIGRATION ISSUES DETECTED ✗✗✗';
    RAISE NOTICE 'Please review the output above.';
  END IF;
END $$;

\echo ''
\echo '================================================================================'
\echo 'VERIFICATION COMPLETE'
\echo '================================================================================'
\echo ''
\echo 'For detailed manual testing, see: scripts/test-variation-migration.md'
\echo ''
