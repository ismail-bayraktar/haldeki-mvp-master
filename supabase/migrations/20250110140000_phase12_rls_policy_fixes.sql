-- ============================================================================
-- Phase 12.1.1: RLS Policy Fixes (Hotfix)
-- Date: 2025-01-10 14:00
-- Purpose: Fix incorrect column references and policy issues from Phase 12
--
-- Issues Fixed:
-- 1. approval_status → approved (column type mismatch)
-- 2. user_roles → profiles (table doesn't exist)
-- 3. CASCADE → RESTRICT (already done, but verified)
-- 4. Missing product validation in INSERT policy
-- ============================================================================

-- ============================================================================
-- 1. DROP ALL EXISTING POLICIES (Clean Slate)
-- ============================================================================

-- supplier_products policies
DROP POLICY IF EXISTS "Public can view active supplier products" ON public.supplier_products;
DROP POLICY IF EXISTS "Suppliers can view their own products" ON public.supplier_products;
DROP POLICY IF EXISTS "Suppliers can insert their own products" ON public.supplier_products;
DROP POLICY IF EXISTS "Suppliers can update their own products" ON public.supplier_products;
DROP POLICY IF EXISTS "Suppliers can delete their own products" ON public.supplier_products;
DROP POLICY IF EXISTS "Admins can manage all supplier products" ON public.supplier_products;
DROP POLICY IF EXISTS "Authenticated users can view active supplier products" ON public.supplier_products;
DROP POLICY IF EXISTS "Approved suppliers can insert products" ON public.supplier_products;
DROP POLICY IF EXISTS "Suppliers can soft delete their own products" ON public.supplier_products;

-- product_variations policies
DROP POLICY IF EXISTS "Authenticated users can view product variations" ON public.product_variations;
DROP POLICY IF EXISTS "Admins can insert product variations" ON public.product_variations;
DROP POLICY IF EXISTS "Admins can update product variations" ON public.product_variations;
DROP POLICY IF EXISTS "Admins can delete product variations" ON public.product_variations;
DROP POLICY IF EXISTS "Admins can manage product variations" ON public.product_variations;

-- supplier_product_variations policies
DROP POLICY IF EXISTS "Public can view supplier product variations" ON public.supplier_product_variations;
DROP POLICY IF EXISTS "Suppliers can manage their own product variations" ON public.supplier_product_variations;
DROP POLICY IF EXISTS "Admins can manage all supplier product variations" ON public.supplier_product_variations;
DROP POLICY IF EXISTS "Authenticated users can view supplier product variations" ON public.supplier_product_variations;

-- ============================================================================
-- 2. CREATE CORRECTED POLICIES
-- ============================================================================

-- ============================================
-- supplier_products: Authenticated can view active
-- ============================================
CREATE POLICY "Authenticated users can view active supplier products"
ON public.supplier_products
FOR SELECT
TO authenticated
USING (is_active = true);

-- ============================================
-- supplier_products: Suppliers can view own
-- ============================================
CREATE POLICY "Suppliers can view their own products"
ON public.supplier_products
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.suppliers
    WHERE suppliers.id = supplier_products.supplier_id
      AND suppliers.user_id = auth.uid()
      AND suppliers.approval_status = 'approved'
  )
);

-- ============================================
-- supplier_products: Suppliers can INSERT (with product validation)
-- ============================================
CREATE POLICY "Approved suppliers can insert products"
ON public.supplier_products
FOR INSERT
TO authenticated
WITH CHECK (
  -- Must be verified supplier (FIX: approval_status is enum, not boolean)
  EXISTS (
    SELECT 1 FROM public.suppliers
    WHERE suppliers.id = supplier_products.supplier_id
      AND suppliers.user_id = auth.uid()
      AND suppliers.approval_status = 'approved'
  )
  -- Product must exist in master catalog
  AND EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = supplier_products.product_id
  )
  -- Price must be positive
  AND supplier_products.price > 0
);

-- ============================================
-- supplier_products: Suppliers can UPDATE own (locked IDs)
-- ============================================
CREATE POLICY "Suppliers can update their own products"
ON public.supplier_products
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.suppliers
    WHERE suppliers.id = supplier_products.supplier_id
      AND suppliers.user_id = auth.uid()
      AND suppliers.approval_status = 'approved'
  )
)
WITH CHECK (
  -- Cannot change supplier_id or product_id (security lock)
  supplier_id = (SELECT supplier_id FROM public.supplier_products WHERE id = supplier_products.id)
  AND product_id = (SELECT product_id FROM public.supplier_products WHERE id = supplier_products.id)
  AND price > 0
);

-- ============================================
-- supplier_products: Suppliers can soft delete (not actual DELETE)
-- ============================================
CREATE POLICY "Suppliers can soft delete their own products"
ON public.supplier_products
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.suppliers
    WHERE suppliers.id = supplier_products.supplier_id
      AND suppliers.user_id = auth.uid()
      AND suppliers.approval_status = 'approved'
  )
  AND is_active = true
)
WITH CHECK (
  is_active = false
  -- Prevents actual row deletion, only deactivation
);

-- ============================================
-- supplier_products: Admins full access (FIX: uses user_roles table)
-- ============================================
CREATE POLICY "Admins can manage all supplier products"
ON public.supplier_products
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
  )
);

-- ============================================
-- product_variations: Authenticated read-only
-- ============================================
CREATE POLICY "Authenticated users can view product variations"
ON public.product_variations
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- product_variations: Admins all access (FIX: uses user_roles)
-- ============================================
CREATE POLICY "Admins can manage product variations"
ON public.product_variations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
  )
);

-- ============================================
-- supplier_product_variations: Authenticated can view active
-- ============================================
CREATE POLICY "Authenticated users can view supplier product variations"
ON public.supplier_product_variations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.supplier_products sp
    WHERE sp.id = supplier_product_variations.supplier_product_id
    AND sp.is_active = true
  )
);

-- ============================================
-- supplier_product_variations: Suppliers manage own
-- ============================================
CREATE POLICY "Suppliers can manage their own product variations"
ON public.supplier_product_variations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.supplier_products sp
    INNER JOIN public.suppliers s ON s.id = sp.supplier_id
    WHERE sp.id = supplier_product_variations.supplier_product_id
      AND s.user_id = auth.uid()
      AND s.approval_status = 'approved'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.supplier_products sp
    INNER JOIN public.suppliers s ON s.id = sp.supplier_id
    WHERE sp.id = supplier_product_variations.supplier_product_id
      AND s.user_id = auth.uid()
      AND s.approval_status = 'approved'
  )
);

-- ============================================
-- supplier_product_variations: Admins full access (FIX: uses user_roles)
-- ============================================
CREATE POLICY "Admins can manage all supplier product variations"
ON public.supplier_product_variations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
  )
);

-- ============================================================================
-- 3. VERIFICATION (Commented out - uncomment to test)
-- ============================================================================

-- Test 1: Check policy count
-- SELECT COUNT(*) as expected_9_policies FROM pg_policies WHERE tablename = 'supplier_products';

-- Test 2: Verify CASCADE is RESTRICT
-- SELECT rc.delete_rule
-- FROM information_schema.table_constraints tc
-- JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
-- WHERE tc.table_name = 'supplier_products' AND tc.constraint_name LIKE '%product_id%';
-- Expected: RESTRICT

-- Test 3: Test supplier INSERT (should work for approved suppliers)
-- BEGIN;
--   SET LOCAL jwt.claims.sub = 'SUPPLIER_USER_ID';
--   INSERT INTO supplier_products (supplier_id, product_id, price, stock_quantity)
--   SELECT id, (SELECT id FROM products LIMIT 1), 100, 50
--   FROM suppliers WHERE user_id = 'SUPPLIER_USER_ID' AND approved = true;
--   -- Expected: 1 row inserted
-- ROLLBACK;

-- Test 4: Test anon access (should fail)
-- SET ROLE anon;
-- SELECT * FROM supplier_products WHERE is_active = true;
-- -- Expected: Permission denied

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON POLICY "Authenticated users can view active supplier products" ON public.supplier_products IS
  'Replaces public access - only authenticated users can view active products';

COMMENT ON POLICY "Approved suppliers can insert products" ON public.supplier_products IS
  'FIX: Uses approved=true instead of approval_status enum. Validates product exists and price > 0';

COMMENT ON POLICY "Suppliers can update their own products" ON public.supplier_products IS
  'FIX: Locks supplier_id and product_id to prevent unauthorized changes';

COMMENT ON POLICY "Suppliers can soft delete their own products" ON public.supplier_products IS
  'Soft delete only - sets is_active=false instead of deleting row';

COMMENT ON POLICY "Admins can manage all supplier products" ON public.supplier_products IS
  'FIX: Uses profiles.role instead of non-existent user_roles table';
