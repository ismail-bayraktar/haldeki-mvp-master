-- ============================================================================
-- Phase 12.1: Critical Security Fixes
-- Date: 2025-01-10
-- Purpose: Fix RLS policies, CASCADE deletes, and column references
-- ============================================================================

-- ============================================================================
-- 1. FIX CASCADE DELETE (Prevent accidental data loss)
-- ============================================================================

DO $$
BEGIN
  -- Drop CASCADE foreign keys if exist
  ALTER TABLE public.supplier_products
    DROP CONSTRAINT IF EXISTS supplier_products_product_id_fkey;

  ALTER TABLE public.supplier_products
    DROP CONSTRAINT IF EXISTS supplier_products_supplier_id_fkey;

  -- Add RESTRICT instead (prevents accidental deletion)
  ALTER TABLE public.supplier_products
    ADD CONSTRAINT supplier_products_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;

  ALTER TABLE public.supplier_products
    ADD CONSTRAINT supplier_products_supplier_id_fkey
    FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE RESTRICT;
END $$;

-- ============================================================================
-- 2. REMOVE BROKEN POLICIES (Clean slate)
-- ============================================================================

-- Drop old problematic policies
DROP POLICY IF EXISTS "Public can view active supplier products" ON public.supplier_products;
DROP POLICY IF EXISTS "Suppliers can view their own products" ON public.supplier_products;
DROP POLICY IF EXISTS "Suppliers can insert their own products" ON public.supplier_products;
DROP POLICY IF EXISTS "Suppliers can update their own products" ON public.supplier_products;
DROP POLICY IF EXISTS "Suppliers can delete their own products" ON public.supplier_products;
DROP POLICY IF EXISTS "Admins can manage all supplier products" ON public.supplier_products;

-- Also drop for product_variations (references user_roles)
DROP POLICY IF EXISTS "Authenticated users can view product variations" ON public.product_variations;
DROP POLICY IF EXISTS "Admins can insert product variations" ON public.product_variations;
DROP POLICY IF EXISTS "Admins can update product variations" ON public.product_variations;
DROP POLICY IF EXISTS "Admins can delete product variations" ON public.product_variations;

-- Also drop for supplier_product_variations (references user_roles)
DROP POLICY IF EXISTS "Public can view supplier product variations" ON public.supplier_product_variations;
DROP POLICY IF EXISTS "Suppliers can manage their own product variations" ON public.supplier_product_variations;
DROP POLICY IF EXISTS "Admins can manage all supplier product variations" ON public.supplier_product_variations;

-- ============================================================================
-- 3. CREATE CORRECT RLS POLICIES
-- ============================================================================

-- ============================================
-- supplier_products SELECT: Authenticated users only
-- ============================================
CREATE POLICY "Authenticated users can view active supplier products"
ON public.supplier_products
FOR SELECT
TO authenticated
USING (is_active = true);

-- ============================================
-- supplier_products INSERT: Verified approved suppliers only
-- ============================================
CREATE POLICY "Approved suppliers can insert products"
ON public.supplier_products
FOR INSERT
TO authenticated
WITH CHECK (
  -- Must be verified supplier (FIX: approved is boolean, not enum)
  EXISTS (
    SELECT 1 FROM public.suppliers
    WHERE suppliers.id = supplier_products.supplier_id
      AND suppliers.user_id = auth.uid()
      AND suppliers.approved = true
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
-- supplier_products UPDATE: Own products only, locked IDs
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
      AND suppliers.approved = true
  )
)
WITH CHECK (
  -- Cannot change supplier_id or product_id (security)
  supplier_id = (SELECT supplier_id FROM public.supplier_products WHERE id = supplier_products.id)
  AND product_id = (SELECT product_id FROM public.supplier_products WHERE id = supplier_products.id)
  AND price > 0
);

-- ============================================
-- supplier_products DELETE: Soft delete only
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
      AND suppliers.approved = true
  )
)
WITH CHECK (
  is_active = false
  -- Prevents actual row deletion, only deactivation
);

-- ============================================
-- supplier_products ALL: Admin full access (FIX: uses profiles)
-- ============================================
CREATE POLICY "Admins can manage all supplier products"
ON public.supplier_products
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
  )
);

-- ============================================
-- product_variations SELECT: All authenticated
-- ============================================
CREATE POLICY "Authenticated users can view product variations"
ON public.product_variations
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- product_variations ALL: Admin only (FIX: uses profiles)
-- ============================================
CREATE POLICY "Admins can manage product variations"
ON public.product_variations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
  )
);

-- ============================================
-- supplier_product_variations SELECT: Public active products
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
-- supplier_product_variations ALL: Suppliers own products
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
    AND s.approved = true
  )
);

-- ============================================
-- supplier_product_variations ALL: Admin full access
-- ============================================
CREATE POLICY "Admins can manage all supplier product variations"
ON public.supplier_product_variations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
  )
);

-- ============================================================================
-- 4. VERIFICATION QUERIES (Run these after deployment)
-- ============================================================================

-- Test 1: Check all policies exist (should return 9)
-- SELECT COUNT(*) as policy_count FROM pg_policies WHERE tablename = 'supplier_products';

-- Test 2: Verify CASCADE is gone (should return RESTRICT)
-- SELECT rc.delete_rule
-- FROM information_schema.table_constraints tc
-- JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
-- WHERE tc.table_name = 'supplier_products';

-- Test 3: Test RLS as anon (should fail)
-- SET ROLE anon;
-- SELECT * FROM supplier_products WHERE is_active = true;
-- Expected: Permission denied

-- Test 4: Test as authenticated supplier
-- SET ROLE authenticated;
-- SELECT * FROM supplier_products WHERE is_active = true;
-- Expected: Returns rows (if any exist)
