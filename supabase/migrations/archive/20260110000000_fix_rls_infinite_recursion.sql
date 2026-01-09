-- ============================================================================
-- Hotfix: RLS Infinite Recursion on supplier_products UPDATE
-- Date: 2026-01-07
-- Issue: "Suppliers can update their own products" policy causes infinite recursion
--
-- Root Cause:
-- Lines 111-112 in phase12_rls_policy_fixes.sql:
--   WITH CHECK (
--     supplier_id = (SELECT supplier_id FROM public.supplier_products WHERE id = supplier_products.id)
--     AND product_id = (SELECT product_id FROM public.supplier_products WHERE id = supplier_products.id)
--   )
--
-- The policy queries the same table it's protecting during UPDATE, causing
-- infinite recursion when the RLS policy is re-evaluated.
--
-- Solution:
-- Remove the WITH CHECK clause that queries supplier_products.
-- The USING clause already validates ownership.
-- supplier_id and product_id are protected by:
-- 1. Application layer (not sent in update mutation)
-- 2. WITH CHECK in INSERT policy (already validated)
-- 3. Foreign key constraints (database level)
-- ============================================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Suppliers can update their own products" ON public.supplier_products;

-- Recreate with fixed logic (NO self-referencing subqueries in WITH CHECK)
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
  -- Only validate: price must be positive
  price > 0
  -- Note: supplier_id and product_id changes are prevented by:
  -- 1. Application layer (useUpdateProduct doesn't send these fields)
  -- 2. Original INSERT policy validation
  -- 3. If needed, add trigger to prevent ID changes
);

-- Also fix the soft delete policy which has similar issue
DROP POLICY IF EXISTS "Suppliers can soft delete their own products" ON public.supplier_products;

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
);

-- ============================================================================
-- Alternative: Add trigger to prevent supplier_id/product_id changes
-- This provides database-level protection without RLS recursion
-- ============================================================================
CREATE OR REPLACE FUNCTION prevent_supplier_product_id_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if supplier_id or product_id is being changed
  IF OLD.supplier_id IS DISTINCT FROM NEW.supplier_id THEN
    RAISE EXCEPTION 'Cannot change supplier_id of supplier_product';
  END IF;

  IF OLD.product_id IS DISTINCT FROM NEW.product_id THEN
    RAISE EXCEPTION 'Cannot change product_id of supplier_product';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS prevent_supplier_product_id_change_trigger ON public.supplier_products;

-- Create trigger
CREATE TRIGGER prevent_supplier_product_id_change_trigger
BEFORE UPDATE ON public.supplier_products
FOR EACH ROW
EXECUTE FUNCTION prevent_supplier_product_id_change();

-- ============================================================================
-- Verification Query (run this to test)
-- ============================================================================
-- This should work now without infinite recursion:
-- BEGIN;
--   SET LOCAL jwt.claims.sub = 'YOUR_TEST_USER_ID';
--   UPDATE supplier_products
--   SET price = 50, stock_quantity = 100
--   WHERE id = 'YOUR_TEST_SUPPLIER_PRODUCT_ID';
--   -- Should succeed without "infinite recursion detected" error
-- ROLLBACK;
