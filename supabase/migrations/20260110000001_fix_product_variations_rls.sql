-- ============================================================================
-- Hotfix: Allow Suppliers to Insert/Update Product Variations
-- Date: 2026-01-07
-- Issue: Suppliers cannot insert product_variations for their own products
--
-- Root Cause:
-- product_variations table only has:
-- 1. "Authenticated users can view" (SELECT only)
-- 2. "Admins can manage" (ALL operations)
--
-- Suppliers need to INSERT/UPDATE/DELETE product_variations for products
-- they own (via supplier_products junction table).
-- ============================================================================

-- Drop the read-only policy
DROP POLICY IF EXISTS "Authenticated users can view product variations" ON public.product_variations;

-- Create new policies that allow suppliers to manage variations for their products

-- 1. All authenticated users can view variations
CREATE POLICY "Authenticated users can view product variations"
ON public.product_variations
FOR SELECT
TO authenticated
USING (true);

-- 2. Suppliers can insert variations for their own products
CREATE POLICY "Suppliers can insert product variations"
ON public.product_variations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.supplier_products sp
    INNER JOIN public.suppliers s ON s.id = sp.supplier_id
    WHERE sp.product_id = product_variations.product_id
      AND s.user_id = auth.uid()
      AND s.approval_status = 'approved'
  )
);

-- 3. Suppliers can update variations for their own products
CREATE POLICY "Suppliers can update product variations"
ON public.product_variations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.supplier_products sp
    INNER JOIN public.suppliers s ON s.id = sp.supplier_id
    WHERE sp.product_id = product_variations.product_id
      AND s.user_id = auth.uid()
      AND s.approval_status = 'approved'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.supplier_products sp
    INNER JOIN public.suppliers s ON s.id = sp.supplier_id
    WHERE sp.product_id = product_variations.product_id
      AND s.user_id = auth.uid()
      AND s.approval_status = 'approved'
  )
);

-- 4. Suppliers can delete variations for their own products
CREATE POLICY "Suppliers can delete product variations"
ON public.product_variations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.supplier_products sp
    INNER JOIN public.suppliers s ON s.id = sp.supplier_id
    WHERE sp.product_id = product_variations.product_id
      AND s.user_id = auth.uid()
      AND s.approval_status = 'approved'
  )
);

-- 5. Admins can still manage all variations
-- First drop if exists, then recreate
DROP POLICY IF EXISTS "Admins can manage product variations" ON public.product_variations;
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

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Test as a supplier user:
-- BEGIN;
--   SET LOCAL jwt.claims.sub = 'SUPPLIER_USER_ID';
--   INSERT INTO product_variations (product_id, variation_type, variation_value, display_order)
--   VALUES ('PRODUCT_ID', 'size', '1 KG', 0);
--   -- Should succeed if supplier owns this product
-- ROLLBACK;
