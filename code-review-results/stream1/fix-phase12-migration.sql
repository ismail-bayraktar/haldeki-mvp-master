-- ============================================================================
-- PHASE 12 DATA MIGRATION FIX SCRIPT
-- Date: 2026-01-08
-- Purpose: Fix data integrity issues found during migration verification
-- Usage: psql $DATABASE_URL -f fix-phase12-migration.sql
-- WARNING: Run verify-phase12-migration.sql first to diagnose issues
-- ============================================================================

\echo '================================================================================'
\echo 'PHASE 12 MIGRATION FIX SCRIPT'
\echo '================================================================================'
\echo ''
\echo 'WARNING: This script will modify data. Backup recommended before proceeding.'
\echo 'Press Ctrl+C to cancel, or wait 5 seconds to continue...'
\select pg_sleep(5);
\echo ''

-- ============================================================================
-- FIX 1: CREATE DEFAULT SUPPLIER FOR ORPHAN PRODUCTS
-- ============================================================================

\echo '>>> Fix 1: Creating default supplier for orphan products'
\echo '---------------------------------------------------------'

INSERT INTO suppliers (id, user_id, name, contact_name, contact_email, is_active, approved)
VALUES (
  '00000000-0000-0000-0000-000000000000'::UUID,
  NULL,
  'Default Supplier',
  'System',
  'system@haldeki.com',
  true,
  true
)
ON CONFLICT (id) DO UPDATE SET
  is_active = true,
  approved = true;

\echo 'Default supplier created/updated.'

-- Assign orphan products to default supplier
INSERT INTO supplier_products (
  supplier_id,
  product_id,
  price,
  stock_quantity,
  availability,
  is_active,
  quality,
  origin,
  min_order_quantity,
  delivery_days,
  created_at,
  updated_at
)
SELECT
  '00000000-0000-0000-0000-000000000000'::UUID,
  p.id,
  COALESCE(p.price, p.base_price, 0),
  COALESCE(p.stock, p.stock_quantity, 0),
  COALESCE(p.availability, 'plenty'),
  COALESCE(p.is_active, true),
  COALESCE(p.quality, 'standart'),
  COALESCE(p.origin, 'Türkiye'),
  1,
  1,
  COALESCE(p.created_at, NOW()),
  COALESCE(p.updated_at, NOW())
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM supplier_products sp WHERE sp.product_id = p.id
)
AND COALESCE(p.price, p.base_price, 0) > 0
ON CONFLICT (supplier_id, product_id) DO NOTHING;

\echo 'Orphan products assigned to default supplier:'
SELECT COUNT(*) as assigned_count
FROM supplier_products
WHERE supplier_id = '00000000-0000-0000-0000-000000000000'::UUID;

\echo ''

-- ============================================================================
-- FIX 2: STANDARDIZE PRODUCT STATUS COLUMN
-- ============================================================================

\echo '>>> Fix 2: Standardizing product status column'
\echo '----------------------------------------------'

-- Check if is_active column exists, add if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added is_active column to products table';
  ELSE
    RAISE NOTICE 'is_active column already exists in products table';
  END IF;
END $$;

-- Migrate data from product_status to is_active if product_status exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'product_status'
  ) THEN
    UPDATE products
    SET is_active = (product_status = 'active' OR product_status IS NULL)
    WHERE product_status IS NOT NULL
    AND is_active IS NULL;

    RAISE NOTICE 'Migrated product_status data to is_active column';

    -- Optionally drop old column after migration
    -- Uncomment below if you want to remove product_status
    -- ALTER TABLE products DROP COLUMN product_status;
  ELSE
    RAISE NOTICE 'product_status column does not exist, skipping migration';
  END IF;
END $$;

-- Ensure all products have is_active set
UPDATE products
SET is_active = true
WHERE is_active IS NULL;

\echo 'Product status column standardized.'

\echo ''

-- ============================================================================
-- FIX 3: REMOVE BROKEN UUID REFERENCES
-- ============================================================================

\echo '>>> Fix 3: Removing broken UUID references'
\echo '------------------------------------------'

DO $$
DECLARE
  broken_count INTEGER;
BEGIN
  -- Count broken references
  SELECT COUNT(*) INTO broken_count
  FROM supplier_products sp
  WHERE NOT EXISTS (
    SELECT 1 FROM products p WHERE p.id = sp.product_id
  );

  IF broken_count > 0 THEN
    RAISE NOTICE 'Found % broken supplier_products references, deleting...', broken_count;

    -- Delete orphan supplier_products
    DELETE FROM supplier_products
    WHERE NOT EXISTS (
      SELECT 1 FROM products p WHERE p.id = supplier_products.product_id
    );

    RAISE NOTICE 'Deleted % orphan supplier_products records', broken_count;
  ELSE
    RAISE NOTICE 'No broken UUID references found';
  END IF;
END $$;

\echo ''

-- ============================================================================
-- FIX 4: APPROVE TEST SUPPLIERS
-- ============================================================================

\echo '>>> Fix 4: Approving test suppliers'
\echo '-----------------------------------'

UPDATE suppliers
SET approved = true
WHERE id IN (
  '11111111-1111-1111-1111-111111111111'::UUID,
  '22222222-2222-2222-2222-222222222222'::UUID
)
AND (approved IS NULL OR approved = false);

\echo 'Test suppliers approved:'
SELECT id, name, approved, is_active
FROM suppliers
WHERE id IN (
  '11111111-1111-1111-1111-111111111111'::UUID,
  '22222222-2222-2222-2222-222222222222'::UUID
);

\echo ''

-- ============================================================================
-- FIX 5: UPDATE BUGUN HALDE COMPARISON VIEW
-- ============================================================================

\echo '>>> Fix 5: Updating bugun_halde_comparison view'
\echo '------------------------------------------------'

CREATE OR REPLACE VIEW bugun_halde_comparison AS
SELECT
  p.id as product_id,
  p.name as product_name,
  p.category,
  p.unit,
  p.images[1] as image_url,
  s.id as supplier_id,
  s.name as supplier_name,
  sp.price,
  sp.previous_price,
  sp.price_change,
  sp.availability,
  sp.stock_quantity,
  sp.quality,
  sp.delivery_days,
  sp.is_featured,
  stats.min_price as market_min_price,
  stats.max_price as market_max_price,
  stats.avg_price as market_avg_price,
  stats.supplier_count as total_suppliers,
  CASE
    WHEN sp.price = stats.min_price THEN true
    ELSE false
  END as is_lowest_price
FROM public.products p
INNER JOIN public.supplier_products sp ON sp.product_id = p.id
INNER JOIN public.suppliers s ON s.id = sp.supplier_id
INNER JOIN LATERAL (
  SELECT
    MIN(spi.price) as min_price,
    MAX(spi.price) as max_price,
    AVG(spi.price) as avg_price,
    COUNT(*) as supplier_count
  FROM public.supplier_products spi
  WHERE spi.product_id = p.id
    AND spi.is_active = true
) stats ON true
WHERE sp.is_active = true
  AND s.is_active = true
  AND COALESCE(p.is_active, true) = true
  AND COALESCE(s.approved, true) = true
ORDER BY p.name, sp.price;

\echo 'bugun_halde_comparison view updated to use is_active consistently.'

\echo ''

-- ============================================================================
-- FIX 6: RECALCULATE PRICE STATISTICS
-- ============================================================================

\echo '>>> Fix 6: Recalculating price statistics'
\echo '-----------------------------------------'

-- Update last_price_update for supplier_products with missing data
UPDATE supplier_products
SET last_price_update = COALESCE(updated_at, created_at)
WHERE last_price_update IS NULL
AND previous_price IS NOT NULL;

\echo 'Price statistics recalculated.'

\echo ''

-- ============================================================================
-- FIX 7: CLEANUP INACTIVE RECORDS
-- ============================================================================

\echo '>>> Fix 7: Cleaning up inactive records (optional)'
\echo '---------------------------------------------------'

-- Deactivate supplier_products for inactive suppliers
UPDATE supplier_products
SET is_active = false
WHERE NOT EXISTS (
  SELECT 1 FROM suppliers s
  WHERE s.id = supplier_products.supplier_id
  AND s.is_active = true
)
AND is_active = true;

\echo 'Deactivated supplier_products for inactive suppliers:'
SELECT COUNT(*) as deactivated_count
FROM supplier_products
WHERE is_active = false;

-- Optionally delete completely (uncomment if desired)
-- DELETE FROM supplier_products
-- WHERE is_active = false
-- AND updated_at < NOW() - INTERVAL '30 days';

\echo ''

-- ============================================================================
-- FIX 8: VERIFY ALL FIXES APPLIED
-- ============================================================================

\echo '>>> Fix 8: Verifying all fixes applied'
\echo '---------------------------------------'

DO $$
DECLARE
  remaining_orphans INTEGER;
  remaining_broken_refs INTEGER;
  total_products INTEGER;
  total_supplier_products INTEGER;
  coverage NUMERIC;
BEGIN
  -- Check remaining issues
  SELECT COUNT(*) INTO remaining_orphans
  FROM products p
  WHERE NOT EXISTS (
    SELECT 1 FROM supplier_products sp WHERE sp.product_id = p.id
  )
  AND COALESCE(p.price, p.base_price, 0) > 0;

  SELECT COUNT(*) INTO remaining_broken_refs
  FROM supplier_products sp
  WHERE NOT EXISTS (
    SELECT 1 FROM products p WHERE p.id = sp.product_id
  );

  SELECT COUNT(*) INTO total_products FROM products;
  SELECT COUNT(*) INTO total_supplier_products FROM supplier_products;

  coverage := CASE
    WHEN total_products > 0 THEN
      (total_supplier_products::NUMERIC / total_products::NUMERIC) * 100
    ELSE 0
  END;

  -- Report results
  RAISE NOTICE '';
  RAISE NOTICE '================================================================================';
  RAISE NOTICE 'FIX VERIFICATION RESULTS';
  RAISE NOTICE '================================================================================';
  RAISE NOTICE 'Remaining orphan products: %', remaining_orphans;
  RAISE NOTICE 'Remaining broken references: %', remaining_broken_refs;
  RAISE NOTICE 'Total products: %', total_products;
  RAISE NOTICE 'Total supplier_products: %', total_supplier_products;
  RAISE NOTICE 'Coverage rate: %%%', ROUND(coverage, 2);
  RAISE NOTICE '';

  IF remaining_orphans = 0 AND remaining_broken_refs = 0 AND coverage >= 95 THEN
    RAISE NOTICE 'All fixes applied successfully! Migration is now healthy.';
  ELSE
    RAISE NOTICE 'Some issues remain. Review output above.';
    IF remaining_orphans > 0 THEN
      RAISE NOTICE 'WARNING: % orphan products still remain', remaining_orphans;
    END IF;
    IF remaining_broken_refs > 0 THEN
      RAISE NOTICE 'WARNING: % broken references still remain', remaining_broken_refs;
    END IF;
    IF coverage < 95 THEN
      RAISE NOTICE 'WARNING: Coverage rate is below 95%% (%%)', coverage;
    END IF;
  END IF;

  RAISE NOTICE '================================================================================';
  RAISE NOTICE '';
END $$;

\echo '>>> Fix script complete. Run verify-phase12-migration.sql again to confirm all issues resolved.'
\echo '================================================================================'
