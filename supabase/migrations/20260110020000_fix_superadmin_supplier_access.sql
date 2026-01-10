-- ================================================================================
-- FIX: SuperAdmin Access to Supplier Dashboard
-- ================================================================================
-- Date: 2026-01-10
-- Issue: "Tedarikçi kaydı bulunamadı" error for SuperAdmins
-- Root Cause: SuperAdmins don't have supplier records, and RLS policies don't
--             allow them to view all suppliers
-- Solution: Add RLS policies to allow SuperAdmins full access to suppliers table
-- ================================================================================

-- ================================================================================
-- STEP 1: Drop existing restrictive policies (if they exist)
-- ================================================================================
DROP POLICY IF EXISTS "SuperAdmins can view all suppliers" ON suppliers;
DROP POLICY IF EXISTS "SuperAdmins can insert suppliers" ON suppliers;
DROP POLICY IF EXISTS "SuperAdmins can update suppliers" ON suppliers;
DROP POLICY IF EXISTS "SuperAdmins can delete suppliers" ON suppliers;
DROP POLICY IF EXISTS "Superadmins and admins can view all suppliers" ON suppliers;
DROP POLICY IF EXISTS "Superadmins and admins can create suppliers" ON suppliers;
DROP POLICY IF EXISTS "Superadmins and admins can update suppliers" ON suppliers;
DROP POLICY IF EXISTS "Superadmins and admins can delete suppliers" ON suppliers;

-- ================================================================================
-- STEP 2: Create SuperAdmin RLS policies
-- ================================================================================
-- These policies allow SuperAdmins to manage ALL suppliers
-- This is necessary because SuperAdmins don't have their own supplier records

-- Policy: SuperAdmins can view all suppliers
CREATE POLICY "SuperAdmins can view all suppliers"
ON suppliers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- Policy: SuperAdmins can insert suppliers
CREATE POLICY "SuperAdmins can insert suppliers"
ON suppliers
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- Policy: SuperAdmins can update suppliers
CREATE POLICY "SuperAdmins can update suppliers"
ON suppliers
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- Policy: SuperAdmins can delete suppliers
CREATE POLICY "SuperAdmins can delete suppliers"
ON suppliers
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- ================================================================================
-- STEP 3: Create Admin RLS policies (for regular admins)
-- ================================================================================
-- Regular admins can also manage all suppliers (but don't have full system access)

DROP POLICY IF EXISTS "Admins can view all suppliers" ON suppliers;
DROP POLICY IF EXISTS "Admins can insert suppliers" ON suppliers;
DROP POLICY IF EXISTS "Admins can update suppliers" ON suppliers;
DROP POLICY IF EXISTS "Admins can delete suppliers" ON suppliers;

-- Policy: Admins can view all suppliers
CREATE POLICY "Admins can view all suppliers"
ON suppliers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can insert suppliers
CREATE POLICY "Admins can insert suppliers"
ON suppliers
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can update suppliers
CREATE POLICY "Admins can update suppliers"
ON suppliers
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can delete suppliers
CREATE POLICY "Admins can delete suppliers"
ON suppliers
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ================================================================================
-- STEP 4: Keep supplier self-access policies
-- ================================================================================
-- Suppliers can still view and manage their own records

DROP POLICY IF EXISTS "Suppliers can view own record" ON suppliers;
DROP POLICY IF EXISTS "Suppliers can update own record" ON suppliers;

-- Policy: Suppliers can view their own record
CREATE POLICY "Suppliers can view own record"
ON suppliers
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'supplier'
  )
);

-- Policy: Suppliers can update their own record (limited fields)
CREATE POLICY "Suppliers can update own record"
ON suppliers
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'supplier'
  )
)
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'supplier'
  )
);

-- ================================================================================
-- STEP 5: Verify RLS is enabled
-- ================================================================================
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- ================================================================================
-- VERIFICATION QUERIES
-- ================================================================================
-- Run these after applying the migration to verify the fix

-- Verification 1: Check policies were created
SELECT
  policyname,
  cmd as command,
  qual as using_expr,
  with_check as check_expr
FROM pg_policies
WHERE tablename = 'suppliers'
  AND schemaname = 'public'
ORDER BY cmd, policyname;

-- Verification 2: Test SuperAdmin access
DO $$
DECLARE
  v_admin_id UUID;
  v_supplier_count INTEGER;
BEGIN
  SELECT id INTO v_admin_id
  FROM auth.users
  WHERE email = 'admin@haldeki.com';

  IF v_admin_id IS NULL THEN
    RAISE NOTICE 'ERROR: SuperAdmin user not found';
    RETURN;
  END IF;

  -- Test: SuperAdmin should see ALL suppliers now
  SELECT COUNT(*) INTO v_supplier_count
  FROM suppliers;

  RAISE NOTICE '====================================';
  RAISE NOTICE 'Verification: SuperAdmin Access Test';
  RAISE NOTICE 'Total suppliers in database: %', v_supplier_count;
  RAISE NOTICE 'Expected: >= 1 (test supplier should exist)';
  RAISE NOTICE '====================================';

  IF v_supplier_count > 0 THEN
    RAISE NOTICE 'SUCCESS: SuperAdmin can now access suppliers table!';
  ELSE
    RAISE NOTICE 'WARNING: No suppliers found - check test supplier creation';
  END IF;
END $$;

-- Verification 3: Test that RLS policies work correctly
DO $$
DECLARE
  v_admin_id UUID;
  v_policy_count INTEGER;
BEGIN
  SELECT id INTO v_admin_id
  FROM auth.users
  WHERE email = 'admin@haldeki.com';

  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE tablename = 'suppliers'
    AND schemaname = 'public'
    AND policyname LIKE '%SuperAdmin%';

  RAISE NOTICE '====================================';
  RAISE NOTICE 'Verification: RLS Policies';
  RAISE NOTICE 'SuperAdmin policies created: %', v_policy_count;
  RAISE NOTICE 'Expected: 4 (SELECT, INSERT, UPDATE, DELETE)';
  RAISE NOTICE '====================================';

  IF v_policy_count = 4 THEN
    RAISE NOTICE 'SUCCESS: All SuperAdmin RLS policies created!';
  ELSE
    RAISE NOTICE 'WARNING: Expected 4 policies, found %', v_policy_count;
  END IF;
END $$;

-- ================================================================================
-- END OF FIX MIGRATION
-- ================================================================================
-- After running this migration:
-- 1. Refresh the frontend page
-- 2. Login as SuperAdmin (admin@haldeki.com)
-- 3. Navigate to /admin/suppliers
-- 4. Verify: Should see list of all suppliers (including test supplier)
-- 5. Verify: No "Tedarikçi kaydı bulunamadı" error
-- ================================================================================
