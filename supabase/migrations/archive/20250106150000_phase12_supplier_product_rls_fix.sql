-- ============================================================================
-- Phase 12.1.2: Fix Supplier Product Creation RLS Policy
-- Date: 2025-01-06
-- Purpose: Allow approved suppliers to create products in products table
--
-- Problem: Phase 9 RLS policy requires supplier_id = auth.uid() in products table
--          but Phase 12 removed supplier_id from products table (junction pattern)
--
-- Solution: Update RLS to allow approved suppliers to insert without supplier_id check
--           Products are master catalog, supplier_products links suppliers to products
-- ============================================================================

-- Drop old Phase 9 policies that reference non-existent supplier_id column
DROP POLICY IF EXISTS "Suppliers can insert their products" ON public.products;
DROP POLICY IF EXISTS "Suppliers can update their products" ON public.products;
DROP POLICY IF EXISTS "Suppliers can delete their products" ON public.products;
DROP POLICY IF EXISTS "Suppliers can view products" ON public.products;

-- New policy: Allow approved suppliers to create products in master catalog
CREATE POLICY "Approved suppliers can insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.suppliers
    WHERE suppliers.user_id = auth.uid()
      AND suppliers.approval_status = 'approved'
  )
);

-- New policy: Suppliers can update their own products (via supplier_products junction)
CREATE POLICY "Suppliers can update products"
ON public.products
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.supplier_products sp
    INNER JOIN public.suppliers s ON s.id = sp.supplier_id
    WHERE sp.product_id = products.id
      AND s.user_id = auth.uid()
      AND s.approval_status = 'approved'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.supplier_products sp
    INNER JOIN public.suppliers s ON s.id = sp.supplier_id
    WHERE sp.product_id = products.id
      AND s.user_id = auth.uid()
      AND s.approval_status = 'approved'
  )
);

-- New policy: Suppliers can delete their own products (via supplier_products junction)
CREATE POLICY "Suppliers can delete products"
ON public.products
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.supplier_products sp
    INNER JOIN public.suppliers s ON s.id = sp.supplier_id
    WHERE sp.product_id = products.id
      AND s.user_id = auth.uid()
      AND s.approval_status = 'approved'
  )
);

-- New policy: Suppliers can view all products (market visibility)
CREATE POLICY "Suppliers can view products"
ON public.products
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.suppliers
    WHERE suppliers.user_id = auth.uid()
      AND suppliers.approval_status = 'approved'
  )
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Approved suppliers can insert products" ON public.products IS
  'Phase 12 fix: Allows approved suppliers to create products in master catalog without supplier_id check';

COMMENT ON POLICY "Suppliers can update products" ON public.products IS
  'Phase 12 fix: Suppliers can update products they have linked via supplier_products junction';

COMMENT ON POLICY "Suppliers can delete products" ON public.products IS
  'Phase 12 fix: Suppliers can delete products they have linked via supplier_products junction';
