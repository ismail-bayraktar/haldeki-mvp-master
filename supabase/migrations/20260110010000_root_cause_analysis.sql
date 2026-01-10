-- ================================================================================
-- ROOT CAUSE ANALYSIS: "Tedarikçi kaydı bulunamadı" Error
-- ================================================================================
-- Date: 2026-01-10
-- Error: SuperAdmins cannot access supplier dashboard
-- Location: F:\donusum\haldeki-love\haldeki-market\supabase\migrations\20260110010000_root_cause_analysis.sql
--
-- EXECUTE IN SUPABASE SQL EDITOR TO DIAGNOSE THE ISSUE
-- ================================================================================

-- ================================================================================
-- PROBLEM SUMMARY
-- ================================================================================
--
-- The error "Tedarikçi kaydı bulunamadı" (Supplier record not found) occurs for
-- SuperAdmins because of a fundamental misunderstanding in the access control logic.
--
-- ROOT CAUSE:
-- 1. SuperAdmins do NOT have supplier records in the suppliers table
-- 2. The frontend queries suppliers WHERE user_id = auth.uid()
-- 3. For SuperAdmins, this returns 0 rows (they're not suppliers!)
-- 4. The has_role() cascading fix was applied, but RLS policies may not use it
--
-- THE FIX:
-- Either:
-- A) Update RLS policies to return ALL suppliers for SuperAdmins (recommended)
-- B) Create a fake supplier record for SuperAdmins (NOT recommended - breaks data model)
--
-- ================================================================================

-- ================================================================================
-- DIAGNOSTIC QUERY 1: Check has_role function definition
-- ================================================================================
-- This verifies the SuperAdmin cascading logic was applied correctly

SELECT
  proname as function_name,
  prosrc as function_source
FROM pg_proc
WHERE proname = 'has_role'
  AND pronamespace = 'public'::regnamespace;

-- EXPECTED RESULT: Should show lines 24-29 with SuperAdmin cascading logic:
--   IF _role != 'superadmin' AND EXISTS (
--     SELECT 1 FROM public.user_roles
--     WHERE user_id = _user_id AND role = 'superadmin'
--   ) THEN
--     RETURN true;
--   END IF;

-- ================================================================================
-- DIAGNOSTIC QUERY 2: Test SuperAdmin role cascading
-- ================================================================================
-- This tests if SuperAdmin cascading is actually working

DO $$
DECLARE
  v_admin_id UUID;
  v_has_supplier_role BOOLEAN;
  v_has_admin_role BOOLEAN;
  v_has_superadmin_role BOOLEAN;
BEGIN
  SELECT id INTO v_admin_id
  FROM auth.users
  WHERE email = 'admin@haldeki.com';

  IF v_admin_id IS NULL THEN
    RAISE NOTICE 'ERROR: SuperAdmin user not found (admin@haldeki.com)';
    RETURN;
  END IF;

  SELECT public.has_role(v_admin_id, 'supplier'::public.app_role) INTO v_has_supplier_role;
  SELECT public.has_role(v_admin_id, 'admin'::public.app_role) INTO v_has_admin_role;
  SELECT public.has_role(v_admin_id, 'superadmin'::public.app_role) INTO v_has_superadmin_role;

  RAISE NOTICE '====================================';
  RAISE NOTICE 'SuperAdmin Role Check Results:';
  RAISE NOTICE 'Email: admin@haldeki.com';
  RAISE NOTICE 'has_role(..., supplier): %', v_has_supplier_role;
  RAISE NOTICE 'has_role(..., admin): %', v_has_admin_role;
  RAISE NOTICE 'has_role(..., superadmin): %', v_has_superadmin_role;
  RAISE NOTICE '====================================';

  IF v_has_supplier_role = false THEN
    RAISE NOTICE 'FAIL: has_role function NOT fixed - SuperAdmin should cascade to supplier';
  ELSE
    RAISE NOTICE 'PASS: has_role cascading works correctly';
  END IF;
END $$;

-- ================================================================================
-- DIAGNOSTIC QUERY 3: Check if SuperAdmin has supplier record
-- ================================================================================
-- This reveals the actual problem: SuperAdmins don't have supplier records

SELECT
  'SuperAdmin supplier record' as check_type,
  s.id,
  s.name,
  s.approval_status,
  s.is_active,
  s.user_id
FROM suppliers s
JOIN auth.users u ON u.id = s.user_id
WHERE u.email = 'admin@haldeki.com';

-- EXPECTED RESULT: Empty (no rows returned)
-- This is NORMAL - SuperAdmins are not suppliers!
-- The frontend code needs to handle this case.

-- ================================================================================
-- DIAGNOSTIC QUERY 4: Count all suppliers
-- ================================================================================
-- This shows if there are any suppliers in the system

SELECT
  COUNT(*) as total_suppliers,
  COUNT(*) FILTER (WHERE approval_status = 'approved') as approved_suppliers,
  COUNT(*) FILTER (WHERE approval_status = 'pending') as pending_suppliers
FROM suppliers;

-- EXPECTED RESULT: At least 1 supplier (test-supplier@haldeki.com)

-- ================================================================================
-- DIAGNOSTIC QUERY 5: Check current RLS policies on suppliers
-- ================================================================================
-- This reveals if RLS policies are blocking SuperAdmin access

SELECT
  policyname,
  qual as using_expression,
  with_check as check_expression,
  cmd as policy_command
FROM pg_policies
WHERE tablename = 'suppliers'
  AND schemaname = 'public'
ORDER BY cmd, policyname;

-- EXPECTED RESULT: Should show policies like:
-- - "Suppliers can view own record" USING (user_id = auth.uid())
-- - "Admins can view all suppliers" USING (has_role(auth.uid(), 'admin'))
--
-- CRITICAL: Check if there's a policy for SuperAdmins to view ALL suppliers
-- If NOT, that's the root cause!

-- ================================================================================
-- DIAGNOSTIC QUERY 6: Test SuperAdmin access via RLS
-- ================================================================================
-- This simulates what happens when SuperAdmin queries the suppliers table

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

  -- This is what the frontend queries
  SELECT COUNT(*) INTO v_supplier_count
  FROM suppliers
  WHERE user_id = v_admin_id;

  RAISE NOTICE '====================================';
  RAISE NOTICE 'Frontend Query Simulation';
  RAISE NOTICE 'Query: SELECT * FROM suppliers WHERE user_id = ?';
  RAISE NOTICE 'Result: % rows found', v_supplier_count;
  RAISE NOTICE '====================================';

  IF v_supplier_count = 0 THEN
    RAISE NOTICE 'ROOT CAUSE: Frontend queries suppliers WHERE user_id = SuperAdmin ID';
    RAISE NOTICE 'This returns 0 rows because SuperAdmins are not suppliers!';
    RAISE NOTICE '';
    RAISE NOTICE 'SOLUTION 1: Update RLS policies to return ALL suppliers for SuperAdmins';
    RAISE NOTICE 'SOLUTION 2: Update frontend to use has_role() check instead of user_id filter';
  END IF;
END $$;

-- ================================================================================
-- DIAGNOSTIC QUERY 7: Verify test supplier exists
-- ================================================================================
-- This checks if the test supplier account was created

SELECT
  u.email,
  s.name as supplier_name,
  s.approval_status,
  s.is_active,
  ur.role
FROM suppliers s
JOIN auth.users u ON u.id = s.user_id
JOIN user_roles ur ON ur.user_id = u.id
WHERE u.email = 'test-supplier@haldeki.com';

-- EXPECTED RESULT: 1 row with approval_status='approved' and role='supplier'

-- ================================================================================
-- DIAGNOSTIC QUERY 8: Comprehensive verification checklist
-- ================================================================================
-- This provides a quick overview of system state

SELECT
  'has_role function exists' as check_item,
  CASE
    WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'has_role' AND pronamespace = 'public'::regnamespace)
    THEN 'PASS'
    ELSE 'FAIL'
  END as status

UNION ALL

SELECT
  'has_role has SuperAdmin cascading',
  CASE
    WHEN EXISTS(
      SELECT 1 FROM pg_proc
      WHERE proname = 'has_role'
      AND pronamespace = 'public'::regnamespace
      AND prosrc LIKE '%superadmin%'
      AND prosrc LIKE '%cascad%'
    )
    THEN 'PASS'
    ELSE 'FAIL'
  END

UNION ALL

SELECT
  'SuperAdmin user exists',
  CASE
    WHEN EXISTS(SELECT 1 FROM user_roles WHERE role = 'superadmin')
    THEN 'PASS'
    ELSE 'FAIL'
  END

UNION ALL

SELECT
  'Suppliers table has data',
  CASE
    WHEN EXISTS(SELECT 1 FROM suppliers)
    THEN 'PASS'
    ELSE 'FAIL'
  END

UNION ALL

SELECT
  'Test supplier exists',
  CASE
    WHEN EXISTS(
      SELECT 1 FROM suppliers s
      JOIN auth.users u ON u.id = s.user_id
      WHERE u.email = 'test-supplier@haldeki.com'
    )
    THEN 'PASS'
    ELSE 'FAIL'
  END

UNION ALL

SELECT
  'RLS enabled on suppliers',
  CASE
    WHEN EXISTS(SELECT 1 FROM pg_class WHERE relname = 'suppliers' AND relrowsecurity = true)
    THEN 'PASS'
    ELSE 'FAIL'
  END

UNION ALL

SELECT
  'RLS policies exist for suppliers',
  CASE
    WHEN EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'suppliers' AND schemaname = 'public')
    THEN 'PASS'
    ELSE 'FAIL'
  END;

-- ================================================================================
-- SOLUTION QUERIES (if diagnosis confirms RLS issue)
-- ================================================================================
-- Run these ONLY after diagnosis confirms the problem

-- SOLUTION 1: Add RLS policy for SuperAdmins to view all suppliers
-- This allows SuperAdmins to see ALL supplier records, not just their own

-- DROP POLICY IF EXISTS "SuperAdmins can view all suppliers" ON suppliers;

-- CREATE POLICY "SuperAdmins can view all suppliers"
-- ON suppliers
-- FOR SELECT
-- TO authenticated
-- USING (public.has_role(auth.uid(), 'superadmin'));

-- SOLUTION 2: Add RLS policy for SuperAdmins to manage all suppliers

-- DROP POLICY IF EXISTS "SuperAdmins can insert suppliers" ON suppliers;
-- DROP POLICY IF EXISTS "SuperAdmins can update suppliers" ON suppliers;
-- DROP POLICY IF EXISTS "SuperAdmins can delete suppliers" ON suppliers;

-- CREATE POLICY "SuperAdmins can insert suppliers"
-- ON suppliers
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- CREATE POLICY "SuperAdmins can update suppliers"
-- ON suppliers
-- FOR UPDATE
-- TO authenticated
-- USING (public.has_role(auth.uid(), 'superadmin'));

-- CREATE POLICY "SuperAdmins can delete suppliers"
-- ON suppliers
-- FOR DELETE
-- TO authenticated
-- USING (public.has_role(auth.uid(), 'superadmin'));

-- ================================================================================
-- END OF DIAGNOSTIC SCRIPT
-- ================================================================================
-- NEXT STEPS:
-- 1. Run all diagnostic queries in Supabase SQL Editor
-- 2. Identify which checks FAIL
-- 3. Apply the appropriate SOLUTION based on diagnosis
-- 4. Re-run diagnostic queries to verify fix
-- 5. Test frontend access with SuperAdmin account
-- ================================================================================
