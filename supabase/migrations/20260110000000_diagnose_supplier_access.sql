-- Diagnostic Script: Verify Supplier Access for SuperAdmins
-- Purpose: Troubleshoot "Tedarikçi kaydı bulunamadı" error
-- Date: 2026-01-10

-- ============================================================================
-- QUERY 1: Verify has_role function has SuperAdmin cascading logic
-- ============================================================================
SELECT
  'Query 1: has_role function source' as diagnostic,
  prosrc as function_code
FROM pg_proc
WHERE proname = 'has_role'
  AND pronamespace = 'public'::regnamespace;

-- Expected: Should contain "SuperAdmin cascading" logic with lines 24-29 checking for 'superadmin' role

-- ============================================================================
-- QUERY 2: Test SuperAdmin cascading directly
-- ============================================================================
DO $$
DECLARE
  v_admin_id UUID;
  v_has_supplier_role BOOLEAN;
  v_has_admin_role BOOLEAN;
  v_has_superadmin_role BOOLEAN;
BEGIN
  -- Get SuperAdmin user ID
  SELECT id INTO v_admin_id
  FROM auth.users
  WHERE email = 'admin@haldeki.com';

  IF v_admin_id IS NULL THEN
    RAISE NOTICE '❌ ERROR: SuperAdmin user not found (admin@haldeki.com)';
    RETURN;
  END IF;

  -- Test role checks
  SELECT public.has_role(v_admin_id, 'supplier'::public.app_role) INTO v_has_supplier_role;
  SELECT public.has_role(v_admin_id, 'admin'::public.app_role) INTO v_has_admin_role;
  SELECT public.has_role(v_admin_id, 'superadmin'::public.app_role) INTO v_has_superadmin_role;

  RAISE NOTICE '====================================';
  RAISE NOTICE 'SuperAdmin Role Check Results:';
  RAISE NOTICE 'User ID: %', v_admin_id;
  RAISE NOTICE 'has_role(..., ''supplier''): %', v_has_supplier_role;
  RAISE NOTICE 'has_role(..., ''admin''): %', v_has_admin_role;
  RAISE NOTICE 'has_role(..., ''superadmin''): %', v_has_superadmin_role;
  RAISE NOTICE '====================================';

  IF v_has_supplier_role = false THEN
    RAISE NOTICE '❌ FAIL: SuperAdmin should have supplier role via cascading!';
  ELSE
    RAISE NOTICE '✅ PASS: SuperAdmin cascading works correctly';
  END IF;
END $$;

-- ============================================================================
-- QUERY 3: Check suppliers table state
-- ============================================================================
SELECT
  'Query 3: Suppliers table count' as diagnostic,
  COUNT(*) as total_suppliers,
  COUNT(*) FILTER (WHERE approval_status = 'approved') as approved_suppliers,
  COUNT(*) FILTER (WHERE approval_status = 'pending') as pending_suppliers
FROM suppliers;

-- ============================================================================
-- QUERY 4: Check if SuperAdmin has a supplier record
-- ============================================================================
SELECT
  'Query 4: SuperAdmin supplier record' as diagnostic,
  s.id,
  s.name,
  s.approval_status,
  s.is_active,
  s.created_at
FROM suppliers s
JOIN auth.users u ON u.id = s.user_id
WHERE u.email = 'admin@haldeki.com';

-- Expected: Empty result (SuperAdmins are NOT suppliers, they access via cascading)

-- ============================================================================
-- QUERY 5: Check RLS policies on suppliers table
-- ============================================================================
SELECT
  'Query 5: RLS policies' as diagnostic,
  policyname,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies
WHERE tablename = 'suppliers'
  AND schemaname = 'public';

-- ============================================================================
-- QUERY 6: Verify user_roles for SuperAdmin
-- ============================================================================
SELECT
  'Query 6: SuperAdmin roles' as diagnostic,
  u.email,
  ur.role
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'admin@haldeki.com';

-- ============================================================================
-- QUERY 7: Test actual supplier query that frontend uses
-- ============================================================================
DO $$
DECLARE
  v_admin_id UUID;
  v_supplier_count INT;
  v_supplier RECORD;
BEGIN
  SELECT id INTO v_admin_id
  FROM auth.users
  WHERE email = 'admin@haldeki.com';

  IF v_admin_id IS NULL THEN
    RAISE NOTICE '❌ ERROR: SuperAdmin user not found';
    RETURN;
  END IF;

  -- Count suppliers visible to SuperAdmin
  SELECT COUNT(*) INTO v_supplier_count
  FROM suppliers s
  WHERE public.has_role(v_admin_id, 'supplier'::public.app_role)
    OR s.user_id = v_admin_id;

  RAISE NOTICE '====================================';
  RAISE NOTICE 'Query 7: Frontend supplier access test';
  RAISE NOTICE 'Suppliers visible to SuperAdmin: %', v_supplier_count;
  RAISE NOTICE '====================================';

  -- Show first few suppliers
  FOR v_supplier IN
    SELECT s.id, s.name, s.approval_status, s.user_id
    FROM suppliers s
    WHERE public.has_role(v_admin_id, 'supplier'::public.app_role)
      OR s.user_id = v_admin_id
    LIMIT 5
  LOOP
    RAISE NOTICE 'Supplier: % (Status: %, ID: %)',
      v_supplier.name,
      v_supplier.approval_status,
      v_supplier.id;
  END LOOP;

  IF v_supplier_count = 0 THEN
    RAISE NOTICE '❌ ROOT CAUSE: No suppliers visible to SuperAdmin!';
    RAISE NOTICE 'This is the actual problem - frontend cannot access supplier data';
  END IF;
END $$;

-- ============================================================================
-- QUERY 8: Check test supplier exists
-- ============================================================================
SELECT
  'Query 8: Test supplier check' as diagnostic,
  u.email,
  s.name as supplier_name,
  s.approval_status,
  s.is_active
FROM suppliers s
JOIN auth.users u ON u.id = s.user_id
WHERE u.email = 'test-supplier@haldeki.com';

-- ============================================================================
-- SUMMARY & RECOMMENDATIONS
-- ============================================================================
SELECT
  '====================================' as line,
  'DIAGNOSTIC COMPLETE' as status,
  '====================================' as line2;

/*
Expected Results for Healthy System:
------------------------------------
1. has_role function should show cascading logic (lines 24-29)
2. SuperAdmin role checks: ALL should return true
3. Suppliers table: At least 1 supplier (test-supplier@haldeki.com)
4. SuperAdmin supplier record: Empty (expected - SuperAdmins aren't suppliers)
5. RLS policies: Should allow SuperAdmin access via has_role()
6. SuperAdmin roles: Should have 'superadmin' role
7. Frontend test: Should return all suppliers (via has_role cascading)
8. Test supplier: Should exist with approval_status='approved'

Root Cause Analysis:
-------------------
If Query 2 shows has_role(..., 'supplier') = FALSE:
  → SQL fix NOT applied correctly
  → Action: Re-run migration 20260109160000_restore_superadmin_role_bypass.sql

If Query 7 shows 0 suppliers:
  → RLS policy blocking SuperAdmin access
  → Action: Update RLS policy to use has_role() cascading

If Query 8 shows no test supplier:
  → Test supplier not created
  → Action: Run migration 20260109140000_create_approved_test_supplier.sql
*/
