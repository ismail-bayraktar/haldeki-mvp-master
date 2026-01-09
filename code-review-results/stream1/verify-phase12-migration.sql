-- ============================================================================
-- PHASE 12 DATA MIGRATION VERIFICATION SCRIPT
-- Date: 2026-01-08
-- Purpose: Verify data integrity after multi-supplier product migration
-- Usage: psql $DATABASE_URL -f verify-phase12-migration.sql
-- ============================================================================

\echo '================================================================================'
\echo 'PHASE 12 MIGRATION VERIFICATION'
\echo '================================================================================'
\echo ''

-- ============================================================================
-- SECTION 1: BASIC COUNTS
-- ============================================================================

\echo '>>> Section 1: Basic Record Counts'
\echo '-----------------------------------'

\echo 'Products table:'
SELECT COUNT(*) as total_products FROM products;

\echo 'Supplier_products junction table:'
SELECT COUNT(*) as total_supplier_products FROM supplier_products;

\echo 'Suppliers table:'
SELECT COUNT(*) as total_suppliers FROM suppliers;

\echo 'Region products:'
SELECT COUNT(*) as total_region_products FROM region_products;

\echo ''

-- ============================================================================
-- SECTION 2: ORPHAN RECORD DETECTION
-- ============================================================================

\echo '>>> Section 2: Orphan Record Detection'
\echo '--------------------------------------'

\echo 'Products WITHOUT supplier assignment (CRITICAL):'
SELECT
  COUNT(*) as orphan_count,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL - Products invisible to users!' END as status
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM supplier_products sp WHERE sp.product_id = p.id
);

\echo 'Supplier_products with broken product references (CRITICAL):'
SELECT
  COUNT(*) as broken_refs,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL - Data corruption!' END as status
FROM supplier_products sp
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE p.id = sp.product_id
);

\echo 'Supplier_products with broken supplier references (CRITICAL):'
SELECT
  COUNT(*) as broken_refs,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL - Data corruption!' END as status
FROM supplier_products sp
WHERE NOT EXISTS (
  SELECT 1 FROM suppliers s WHERE s.id = sp.supplier_id
);

\echo 'Region_products with broken product references:'
SELECT
  COUNT(*) as broken_refs,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM region_products rp
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE p.id = rp.product_id
);

\echo ''

-- ============================================================================
-- SECTION 3: DATA COVERAGE ANALYSIS
-- ============================================================================

\echo '>>> Section 3: Data Coverage Analysis'
\echo '-------------------------------------'

\echo 'Product-to-supplier coverage:'
WITH coverage AS (
  SELECT
    COUNT(*) as total_products,
    COUNT(*) FILTER (
      WHERE EXISTS (SELECT 1 FROM supplier_products sp WHERE sp.product_id = products.id)
    ) as products_with_suppliers
  FROM products
)
SELECT
  total_products,
  products_with_suppliers,
  total_products - products_with_suppliers as orphan_products,
  ROUND(
    (products_with_suppliers::NUMERIC / NULLIF(total_products, 0)) * 100,
    2
  ) as coverage_percent,
  CASE
    WHEN (products_with_suppliers::NUMERIC / NULLIF(total_products, 0)) >= 0.95 THEN 'PASS'
    ELSE 'FAIL - Coverage below 95%'
  END as status
FROM coverage;

\echo 'Supplier product distribution:'
SELECT
  s.name as supplier_name,
  COUNT(*) as product_count,
  MIN(sp.price) as min_price,
  MAX(sp.price) as max_price,
  ROUND(AVG(sp.price), 2) as avg_price
FROM suppliers s
LEFT JOIN supplier_products sp ON s.id = sp.supplier_id
GROUP BY s.id, s.name
ORDER BY product_count DESC;

\echo ''

-- ============================================================================
-- SECTION 4: TEST DATA VERIFICATION
-- ============================================================================

\echo '>>> Section 4: Test Data Verification'
\echo '--------------------------------------'

\echo 'Test suppliers (Aliğa + Menemen):'
SELECT
  COUNT(*) as test_supplier_count,
  CASE WHEN COUNT(*) = 2 THEN 'PASS' ELSE 'FAIL - Expected 2 test suppliers' END as status
FROM suppliers
WHERE id IN (
  '11111111-1111-1111-1111-111111111111'::UUID,
  '22222222-2222-2222-2222-222222222222'::UUID
);

\echo 'ABC brand products (Aliğa):'
SELECT
  COUNT(*) as abc_product_count,
  CASE WHEN COUNT(*) = 30 THEN 'PASS' ELSE 'FAIL - Expected 30 ABC products' END as status
FROM products
WHERE name LIKE 'ABC %';

\echo 'XYZ brand products (Menemen):'
SELECT
  COUNT(*) as xyz_product_count,
  CASE WHEN COUNT(*) = 30 THEN 'PASS' ELSE 'FAIL - Expected 30 XYZ products' END as status
FROM products
WHERE name LIKE 'XYZ %';

\echo 'Total test products (ABC + XYZ):'
SELECT
  COUNT(*) as total_test_products,
  CASE WHEN COUNT(*) = 60 THEN 'PASS' ELSE 'FAIL - Expected 60 test products' END as status
FROM products
WHERE name LIKE 'ABC %' OR name LIKE 'XYZ %';

\echo ''

-- ============================================================================
-- SECTION 5: SUPPLIER PRODUCTS JUNCTION VERIFICATION
-- ============================================================================

\echo '>>> Section 5: Supplier Products Junction Verification'
\echo '------------------------------------------------------'

\echo 'Aliğa supplier products (should be 30):'
SELECT
  COUNT(*) as aliaga_junction_count,
  CASE WHEN COUNT(*) = 30 THEN 'PASS' ELSE 'FAIL - Expected 30 junction records' END as status
FROM supplier_products
WHERE supplier_id = '11111111-1111-1111-1111-111111111111'::UUID;

\echo 'Menemen supplier products (should be 30 with 10% price increase):'
SELECT
  COUNT(*) as menemen_junction_count,
  ROUND(AVG(price), 2) as avg_price,
  CASE WHEN COUNT(*) = 30 THEN 'PASS' ELSE 'FAIL - Expected 30 junction records' END as status
FROM supplier_products
WHERE supplier_id = '22222222-2222-2222-2222-222222222222'::UUID;

\echo 'Total junction records (should be 60):'
SELECT
  COUNT(*) as total_junction,
  CASE WHEN COUNT(*) = 60 THEN 'PASS' ELSE 'FAIL - Expected 60 junction records' END as status
FROM supplier_products
WHERE supplier_id IN (
  '11111111-1111-1111-1111-111111111111'::UUID,
  '22222222-2222-2222-2222-222222222222'::UUID
);

\echo ''

-- ============================================================================
-- SECTION 6: UUID INTEGRITY CHECKS
-- ============================================================================

\echo '>>> Section 6: UUID Integrity Checks'
\echo '------------------------------------'

\echo 'Malformed UUIDs in products.id:'
SELECT
  COUNT(*) FILTER (
    WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  ) as malformed_uuids,
  CASE WHEN COUNT(*) FILTER (
    WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  ) = 0 THEN 'PASS' ELSE 'FAIL - Malformed UUIDs detected' END as status
FROM products;

\echo 'Malformed UUIDs in supplier_products:'
SELECT
  COUNT(*) FILTER (
    WHERE product_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    OR supplier_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  ) as malformed_uuids,
  CASE WHEN COUNT(*) FILTER (
    WHERE product_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    OR supplier_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  ) = 0 THEN 'PASS' ELSE 'FAIL - Malformed UUIDs detected' END as status
FROM supplier_products;

\echo ''

-- ============================================================================
-- SECTION 7: RLS POLICY EFFECTIVENESS
-- ============================================================================

\echo '>>> Section 7: RLS Policy Check (Manual Verification Required)'
\echo '--------------------------------------------------------------'

\echo 'Products that should be visible to public:'
SELECT
  COUNT(*) as visible_products
FROM products p
WHERE COALESCE(p.is_active, true) = true
  AND EXISTS (
    SELECT 1 FROM supplier_products sp
    WHERE sp.product_id = p.id
    AND sp.is_active = true
  );

\echo 'Active supplier products:'
SELECT
  COUNT(*) as active_supplier_products,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_supplier_products
FROM supplier_products;

\echo 'Active suppliers:'
SELECT
  COUNT(*) as active_suppliers,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_suppliers,
  COUNT(*) FILTER (WHERE approved IS NULL OR approved = false) as unapproved_suppliers
FROM suppliers;

\echo ''

-- ============================================================================
-- SECTION 8: PRICE DATA INTEGRITY
-- ============================================================================

\echo '>>> Section 8: Price Data Integrity'
\echo '-----------------------------------'

\echo 'Products with zero or null prices:'
SELECT
  COUNT(*) FILTER (WHERE price IS NULL) as null_price_count,
  COUNT(*) FILTER (WHERE price = 0) as zero_price_count,
  COUNT(*) FILTER (WHERE price IS NULL OR price = 0) as total_invalid_price,
  CASE WHEN COUNT(*) FILTER (WHERE price IS NULL OR price <= 0) = 0 THEN 'PASS' ELSE 'WARN - Invalid prices detected' END as status
FROM products;

\echo 'Supplier products with zero or null prices:'
SELECT
  COUNT(*) FILTER (WHERE price IS NULL) as null_price_count,
  COUNT(*) FILTER (WHERE price <= 0) as zero_price_count,
  COUNT(*) FILTER (WHERE price IS NULL OR price <= 0) as total_invalid_price,
  CASE WHEN COUNT(*) FILTER (WHERE price IS NULL OR price <= 0) = 0 THEN 'PASS' ELSE 'FAIL - Invalid prices in junction table' END as status
FROM supplier_products;

\echo 'Price comparison: Products vs Supplier_products (should match):'
WITH price_check AS (
  SELECT
    p.id,
    p.price as product_price,
    sp.price as supplier_price
  FROM products p
  INNER JOIN supplier_products sp ON p.id = sp.product_id
  WHERE p.price IS NOT NULL AND sp.price IS NOT NULL
)
SELECT
  COUNT(*) as total_compared,
  COUNT(*) FILTER (WHERE ABS(product_price - supplier_price) < 0.01) as matching_prices,
  COUNT(*) FILTER (WHERE ABS(product_price - supplier_price) >= 0.01) as differing_prices,
  CASE
    WHEN COUNT(*) FILTER (WHERE ABS(product_price - supplier_price) >= 0.01) = 0 THEN 'PASS - All prices match'
    ELSE 'WARN - Price differences detected (expected for Menemen +10%)'
  END as status
FROM price_check;

\echo ''

-- ============================================================================
-- SECTION 9: FINAL VERDICT
-- ============================================================================

\echo '>>> Section 9: Final Health Score'
\echo '---------------------------------'

DO $$
DECLARE
  total_products INTEGER;
  total_supplier_products INTEGER;
  orphan_products INTEGER;
  broken_refs INTEGER;
  coverage NUMERIC;
  health_score INTEGER;
  status TEXT;
BEGIN
  -- Get metrics
  SELECT COUNT(*) INTO total_products FROM products;
  SELECT COUNT(*) INTO total_supplier_products FROM supplier_products;

  SELECT COUNT(*) INTO orphan_products
  FROM products p
  WHERE NOT EXISTS (
    SELECT 1 FROM supplier_products sp WHERE sp.product_id = p.id
  );

  SELECT COUNT(*) INTO broken_refs
  FROM supplier_products sp
  WHERE NOT EXISTS (
    SELECT 1 FROM products p WHERE p.id = sp.product_id
  );

  -- Calculate coverage
  coverage := CASE
    WHEN total_products > 0 THEN
      (total_supplier_products::NUMERIC / total_products::NUMERIC) * 100
    ELSE 0
  END;

  -- Calculate health score
  health_score := 100
    - (orphan_products * 5)       -- -5 points per orphan product
    - (broken_refs * 10)          -- -10 points per broken ref
    - (CASE WHEN coverage < 95 THEN 20 ELSE 0 END);  -- -20 if coverage < 95%

  -- Determine status
  IF health_score >= 90 THEN
    status := 'EXCELLENT';
  ELSIF health_score >= 75 THEN
    status := 'GOOD';
  ELSIF health_score >= 60 THEN
    status := 'FAIR';
  ELSE
    status := 'POOR - REQUIRES IMMEDIATE ATTENTION';
  END IF;

  -- Report results
  RAISE NOTICE '';
  RAISE NOTICE '================================================================================';
  RAISE NOTICE 'MIGRATION HEALTH SCORE: %/100 (%)', health_score, status;
  RAISE NOTICE '================================================================================';
  RAISE NOTICE 'Total products: %', total_products;
  RAISE NOTICE 'Supplier products: %', total_supplier_products;
  RAISE NOTICE 'Orphan products: %', orphan_products;
  RAISE NOTICE 'Broken references: %', broken_refs;
  RAISE NOTICE 'Coverage rate: %%%', ROUND(coverage, 2);
  RAISE NOTICE '';

  -- Fail if critical issues
  IF orphan_products > 0 THEN
    RAISE EXCEPTION 'CRITICAL: % products without supplier assignment! Run fix scripts.', orphan_products;
  END IF;

  IF broken_refs > 0 THEN
    RAISE EXCEPTION 'CRITICAL: % broken UUID references! Run fix scripts.', broken_refs;
  END IF;

  IF health_score < 60 THEN
    RAISE EXCEPTION 'Migration health score too low (%%). Review and fix issues.', health_score;
  END IF;

  RAISE NOTICE 'Migration health check: PASSED';
  RAISE NOTICE '================================================================================';
  RAISE NOTICE '';
END $$;

\echo '>>> Verification complete. Review output above for any FAIL or WARN status.'
\echo '================================================================================'
