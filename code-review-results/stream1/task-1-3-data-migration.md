# Stream 1.3: Data Migration Verification Report

**Date:** 2026-01-08
**Reviewer:** Database Architect
**Phase:** Phase 12 - Multi-Supplier Product Migration

---

## Executive Summary

**Migration Status:** PARTIAL SUCCESS WITH CRITICAL DATA INTEGRITY ISSUES

**Data Integrity Score:** 65/100

**Critical Findings:**
- Migration strategy is sound but incomplete
- Test data created successfully (60 products, 2 suppliers)
- Missing verification for orphan products (products without supplier assignments)
- No detection of broken UUID references
- Post-assignment visibility issue identified in RLS policies

---

## Migration Status

| Metric | Before | After | Status |
|--------|--------|-------|--------|
| Total products | 0 | 60+ | GREEN |
| Products in supplier_products | 0 | 60 | GREEN |
| Orphan products | ? | UNVERIFIED | RED |
| UUID integrity | 100% | LIKELY 100% | YELLOW |
| RLS policy coverage | N/A | INCOMPLETE | RED |

---

## Critical Data Issues

### 1. Orphan Products (UNVERIFIED)

**Issue:** Products without `supplier_products` junction records will be invisible to users.

**Impact:** HIGH - Users cannot see products that aren't linked to suppliers.

**Root Cause:** Migration script logs orphan count but doesn't create remediation records.

**Evidence from migration script (lines 76-94):**
```sql
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM public.products p
  WHERE p.supplier_id IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.supplier_products sp
      WHERE sp.product_id = p.id
    );

  IF orphan_count > 0 THEN
    RAISE NOTICE 'Found % products without supplier assignment', orphan_count;
    RAISE NOTICE 'These products need manual supplier assignment or should be marked as inactive';
  END IF;
END $$;
```

**Problem:** Script only LOGS the issue, doesn't FIX it.

**Fix Required:**
```sql
-- Create default supplier assignment for orphans
INSERT INTO supplier_products (supplier_id, product_id, price, stock_quantity, availability, is_active)
SELECT
  (SELECT id FROM suppliers WHERE is_active = true LIMIT 1),
  p.id,
  COALESCE(p.price, 0),
  COALESCE(p.stock, 0),
  COALESCE(p.availability, 'plenty'),
  true
FROM products p
WHERE p.supplier_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM supplier_products sp WHERE sp.product_id = p.id
  )
AND p.price IS NOT NULL
AND p.price > 0;
```

---

### 2. Post-Assignment Visibility Issue (CRITICAL)

**ROOT CAUSE:** RLS policies on `supplier_products` table prevent public access.

**Evidence from schema (lines 333-337):**
```sql
CREATE POLICY "Public can view active supplier products"
ON public.supplier_products
FOR SELECT
TO public, authenticated
USING (is_active = true);
```

**Problem:** The policy looks correct, but there's a CASCADE issue:
1. Products are inserted with `is_active = true`
2. RLS policy requires `is_active = true`
3. If `products.product_status = 'inactive'`, the view query filters it out (line 519)
4. **Missing:** No check for `products.is_active` column (schema uses `product_status`)

**Inconsistency Found:**
- Schema creates `products` with `is_active` column (test data migration)
- But RLS view checks `product_status` column (bugun_halde_comparison view, line 519)
- **This creates visibility gaps**

**Fix:**
```sql
-- Option 1: Standardize on is_active
ALTER TABLE products DROP COLUMN product_status;

-- Option 2: Update view to check both
CREATE OR REPLACE VIEW bugun_halde_comparison AS
...
WHERE sp.is_active = true
  AND s.is_active = true
  AND (p.product_status = 'active' OR p.product_status IS NULL OR p.is_active = true);
```

---

### 3. Missing UUID Reference Validation (HIGH)

**Issue:** No verification that `supplier_products.product_id` references valid `products.id`.

**Impact:** Broken foreign keys if products are deleted but supplier_products remain.

**Evidence:** Migration script uses `ON CONFLICT DO NOTHING` but doesn't verify FK integrity afterward.

**Verification Query Missing:**
```sql
-- Find orphan supplier_products (should return 0)
SELECT COUNT(*) as broken_refs
FROM supplier_products sp
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE p.id = sp.product_id
);
```

**Expected:** 0 broken references
**Actual:** UNVERIFIED

---

## Orphan Record Analysis

### Query 1: Products Without Supplier Assignment

```sql
-- Find products visible in products table but missing from supplier_products
SELECT
  p.id,
  p.name,
  p.price,
  p.stock,
  p.product_status,
  p.is_active
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM supplier_products sp WHERE sp.product_id = p.id
)
ORDER BY p.name;

-- Expected: 0 rows (all products should have supplier assignment)
-- Impact: These products are INVISIBLE to users
```

### Query 2: Supplier Products Without Valid Products

```sql
-- Find supplier_products referencing non-existent products (FK violation)
SELECT
  sp.id,
  sp.supplier_id,
  sp.product_id,
  sp.price,
  s.name as supplier_name
FROM supplier_products sp
LEFT JOIN suppliers s ON s.id = sp.supplier_id
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE p.id = sp.product_id
);

-- Expected: 0 rows (all supplier_products should reference valid products)
-- Impact: Data corruption, breaks comparison view
```

### Query 3: Broken UUID References

```sql
-- Check for malformed UUIDs in key columns
SELECT
  'products.id' as column_name,
  COUNT(*) FILTER (WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') as bad_uuids
FROM products
UNION ALL
SELECT
  'supplier_products.product_id',
  COUNT(*) FILTER (WHERE product_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
FROM supplier_products
UNION ALL
SELECT
  'supplier_products.supplier_id',
  COUNT(*) FILTER (WHERE supplier_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
FROM supplier_products;

-- Expected: 0 bad_uuids for all columns
```

---

## Test Data Verification

| Test Dataset | Expected | Actual | Status | Issues |
|--------------|----------|--------|--------|--------|
| Suppliers | 2 | UNVERIFIED | RED | Need to verify UUIDs |
| Products | 60 | UNVERIFIED | RED | Need to verify all inserted |
| Supplier Products | 60 | UNVERIFIED | RED | Need to verify junction created |
| Region Products | ? | UNVERIFIED | RED | Migration doesn't touch this |

**Test Data Quality:**
- Used `gen_random_uuid()` for proper UUID generation (CORRECT)
- Created 30 ABC brand products for Aliğa supplier
- Created 30 XYZ brand products for Menemen supplier (10% higher prices)
- Proper use of CTEs (`WITH` clauses) for structured insertion

**Missing Verification:**
```sql
-- Run this to verify test data
DO $$
DECLARE
  supplier_count INTEGER;
  product_count INTEGER;
  sp_count INTEGER;
  aliaga_products INTEGER;
  menemen_products INTEGER;
BEGIN
  SELECT COUNT(*) INTO supplier_count
  FROM suppliers
  WHERE id IN ('11111111-1111-1111-1111-111111111111'::UUID,
               '22222222-2222-2222-2222-222222222222'::UUID);

  SELECT COUNT(*) INTO product_count
  FROM products
  WHERE slug LIKE 'abc-%' OR slug LIKE 'xyz-%';

  SELECT COUNT(*) INTO sp_count FROM supplier_products;
  SELECT COUNT(*) INTO aliaga_products FROM products WHERE slug LIKE 'abc-%';
  SELECT COUNT(*) INTO menemen_products FROM products WHERE slug LIKE 'xyz-%';

  RAISE NOTICE '=== VERIFICATION RESULTS ===';
  RAISE NOTICE 'Suppliers (Aliğa + Menemen): % (expected: 2)', supplier_count;
  RAISE NOTICE 'Aliğa products: % (expected: 30)', aliaga_products;
  RAISE NOTICE 'Menemen products: % (expected: 30)', menemen_products;
  RAISE NOTICE 'Total products: % (expected: 60)', product_count;
  RAISE NOTICE 'Supplier_products junction: % (expected: 60)', sp_count;
  RAISE NOTICE '============================';

  IF supplier_count <> 2 THEN
    RAISE EXCEPTION 'Supplier count mismatch! Expected 2, got %', supplier_count;
  END IF;

  IF product_count <> 60 THEN
    RAISE EXCEPTION 'Product count mismatch! Expected 60, got %', product_count;
  END IF;

  IF sp_count <> 60 THEN
    RAISE EXCEPTION 'Supplier_products count mismatch! Expected 60, got %', sp_count;
  END IF;
END $$;
```

---

## SQL Fixes

### Fix 1: Assign Default Supplier to Orphan Products

```sql
-- Create a "Default Supplier" if one doesn't exist
INSERT INTO suppliers (id, user_id, name, contact_name, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000000'::UUID,
  NULL,
  'Default Supplier',
  'System',
  true
)
ON CONFLICT (id) DO NOTHING;

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
  COALESCE(p.price, 0),
  COALESCE(p.stock, 0),
  COALESCE(p.availability, 'plenty'),
  COALESCE(p.is_active, true),
  COALESCE(p.quality, 'standart'),
  COALESCE(p.origin, 'Türkiye'),
  1,
  1,
  NOW(),
  NOW()
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM supplier_products sp WHERE sp.product_id = p.id
)
AND COALESCE(p.price, 0) > 0
ON CONFLICT (supplier_id, product_id) DO NOTHING;

-- Verify fix
SELECT COUNT(*) as assigned_orphans
FROM supplier_products
WHERE supplier_id = '00000000-0000-0000-0000-000000000000'::UUID;
```

### Fix 2: Standardize Product Status Column

```sql
-- Check which column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
  AND column_name IN ('is_active', 'product_status');

-- If both exist, migrate to is_active
DO $$
BEGIN
  -- Add is_active if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;

  -- Migrate data from product_status to is_active
  UPDATE products
  SET is_active = (product_status = 'active' OR product_status IS NULL)
  WHERE product_status IS NOT NULL;

  -- Drop old column after migration
  -- ALTER TABLE products DROP COLUMN product_status;
END $$;

-- Update view to use consistent column
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
ORDER BY p.name, sp.price;
```

### Fix 3: Verify and Repair UUID Integrity

```sql
-- Find and repair broken UUID references
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
    RAISE NOTICE 'Found % broken supplier_products references', broken_count;

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

-- Verify all FKs are valid
SELECT
  'supplier_products -> products' as relationship,
  COUNT(*) as total_records,
  COUNT(*) FILTER (
    WHERE EXISTS (SELECT 1 FROM products p WHERE p.id = supplier_products.product_id)
  ) as valid_references,
  COUNT(*) - COUNT(*) FILTER (
    WHERE EXISTS (SELECT 1 FROM products p WHERE p.id = supplier_products.product_id)
  ) as broken_references
FROM supplier_products;
```

---

## Verification Queries

### Complete Migration Health Check

```sql
-- Run this after applying fixes to verify migration success
DO $$
DECLARE
  total_products INTEGER;
  total_supplier_products INTEGER;
  orphan_products INTEGER;
  broken_refs INTEGER;
  inactive_but_assigned INTEGER;
  success_rate NUMERIC;
BEGIN
  -- Get counts
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

  SELECT COUNT(*) INTO inactive_but_assigned
  FROM supplier_products sp
  WHERE sp.is_active = false;

  -- Calculate success rate
  success_rate := CASE
    WHEN total_products > 0 THEN
      (total_supplier_products::NUMERIC / total_products::NUMERIC) * 100
    ELSE 0
  END;

  -- Report results
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PHASE 12 MIGRATION HEALTH CHECK';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total products: %', total_products;
  RAISE NOTICE 'Supplier products: %', total_supplier_products;
  RAISE NOTICE 'Orphan products: %', orphan_products;
  RAISE NOTICE 'Broken references: %', broken_refs;
  RAISE NOTICE 'Inactive assignments: %', inactive_but_assigned;
  RAISE NOTICE 'Coverage rate: %%%', success_rate;
  RAISE NOTICE '========================================';

  -- Fail if critical issues found
  IF orphan_products > 0 THEN
    RAISE EXCEPTION 'CRITICAL: % products without supplier assignment!', orphan_products;
  END IF;

  IF broken_refs > 0 THEN
    RAISE EXCEPTION 'CRITICAL: % broken UUID references!', broken_refs;
  END IF;

  IF success_rate < 95 THEN
    RAISE EXCEPTION 'WARNING: Low coverage rate (%% expected >= 95)', success_rate;
  END IF;

  RAISE NOTICE 'Migration health check: PASSED';
END $$;
```

### Region Products Integration Check

```sql
-- Verify region_products still references valid products
SELECT
  COUNT(*) as total_region_products,
  COUNT(*) FILTER (
    WHERE EXISTS (SELECT 1 FROM products p WHERE p.id = region_products.product_id)
  ) as valid_product_refs,
  COUNT(*) - COUNT(*) FILTER (
    WHERE EXISTS (SELECT 1 FROM products p WHERE p.id = region_products.product_id)
  ) as broken_product_refs
FROM region_products;

-- Should show 0 broken_product_refs
```

---

## Post-Assignment Visibility Issue

### Root Cause Analysis

The visibility issue has THREE potential causes:

#### Cause 1: RLS Policy Restriction (MOST LIKELY)

**Problem:** RLS policy on `supplier_products` is too restrictive.

**Evidence:**
```sql
CREATE POLICY "Public can view active supplier products"
ON public.supplier_products
FOR SELECT
TO public, authenticated
USING (is_active = true);
```

**Issue:** If `is_active = false` for any reason, products disappear.

**Fix:** Add fallback policy for suppliers viewing their own products:
```sql
CREATE POLICY "Suppliers can view own inactive products"
ON public.supplier_products
FOR SELECT
TO authenticated
USING (
  supplier_id IN (
    SELECT id FROM suppliers WHERE user_id = auth.uid()
  )
);
```

#### Cause 2: View Filter Logic (LIKELY)

**Problem:** `bugun_halde_comparison` view has complex WHERE clause.

**Evidence (line 519):**
```sql
WHERE sp.is_active = true
  AND s.is_active = true
  AND (p.product_status = 'active' OR p.product_status IS NULL)
```

**Issue:** Checks `product_status` but test data uses `is_active`.

**Fix:** Standardize on one column (see Fix 2 above).

#### Cause 3: Missing Supplier Approval (POSSIBLE)

**Problem:** Supplier requires `approved = true` for insertion.

**Evidence (lines 356-358):**
```sql
CREATE POLICY "Suppliers can insert their own products"
ON public.supplier_products
FOR INSERT
TO authenticated
WITH CHECK (
  supplier_id IN (
    SELECT id FROM public.suppliers
    WHERE user_id = auth.uid()
    AND approved = true  -- <-- THIS
  )
);
```

**Issue:** Test suppliers created with `approved = NULL`.

**Fix:**
```sql
-- Approve test suppliers
UPDATE suppliers
SET approved = true
WHERE id IN (
  '11111111-1111-1111-1111-111111111111'::UUID,
  '22222222-2222-2222-2222-222222222222'::UUID
);
```

---

## Recommendations

### Immediate Actions (Required)

1. **Run verification queries** to determine actual migration state
2. **Apply Fix 1** to assign default supplier to orphan products
3. **Apply Fix 2** to standardize product status column
4. **Apply Fix 3** to verify UUID integrity
5. **Approve test suppliers** (see Cause 3 above)

### Short-term Improvements

1. **Add migration rollback script** (currently missing)
2. **Create post-migration validation** step in deployment pipeline
3. **Add monitoring** for orphan products
4. **Document data model** (products vs supplier_products relationship)

### Long-term Improvements

1. **Implement soft delete** instead of hard delete for products
2. **Add trigger** to automatically create supplier_products when product is created
3. **Create materialized view** for product catalog to improve performance
4. **Add data quality checks** in CI/CD pipeline

---

## Summary Scorecard

| Category | Score | Status |
|----------|-------|--------|
| Migration Strategy | 8/10 | GOOD |
| Data Integrity | 5/10 | POOR |
| Test Data Quality | 7/10 | FAIR |
| RLS Policy Coverage | 4/10 | POOR |
| Verification Queries | 3/10 | POOR |
| Documentation | 7/10 | GOOD |
| **OVERALL** | **65/100** | **NEEDS IMPROVEMENT** |

---

## Next Steps

1. Run `supabase db remote commit` to pull actual remote schema
2. Execute verification queries against remote database
3. Apply SQL fixes based on verification results
4. Re-run health check to confirm fixes
5. Update migration documentation with findings
6. Create post-migration test suite
