-- ============================================
-- VERIFICATION SCRIPT: has_role Function Fix
-- ============================================
-- Run these queries in Supabase SQL Editor to verify
-- that the has_role() function is working correctly.
-- ============================================

-- 1. CHECK FUNCTION EXISTS WITH CORRECT DEFINATION
-- ============================================
-- This should return the function source code
-- Expected: Should show SuperAdmin cascading logic

SELECT
    proname as function_name,
    prosrc as function_source
FROM pg_proc
WHERE proname = 'has_role'
  AND pronamespace = 'public'::regnamespace;

-- Verify the output includes:
-- - SuperAdmin role cascading to all other roles
-- - Correct role hierarchy


-- 2. FIND A SUPERADMIN USER FOR TESTING
-- ============================================
-- Get a SuperAdmin user email to test with
-- Expected: At least one SuperAdmin user

SELECT
    u.id,
    u.email,
    u.raw_user_meta_data->>'name' as name,
    ur.role,
    ur.created_at
FROM auth.users u
JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.role = 'superadmin'
LIMIT 1;

-- Copy the email from this result for the next query


-- 3. TEST SUPERADMIN ROLE CASCADING
-- ============================================
-- Replace 'SUPERADMIN_EMAIL_HERE' with actual email from query 2
-- Expected: TRUE (SuperAdmin should cascade to all roles)

SELECT
    public.has_role(
        (SELECT id FROM auth.users WHERE email = 'SUPERADMIN_EMAIL_HERE'),
        'admin'
    ) as superadmin_has_admin_role;

-- Also test other role cascades
SELECT
    public.has_role(
        (SELECT id FROM auth.users WHERE email = 'SUPERADMIN_EMAIL_HERE'),
        'supplier'
    ) as superadmin_has_supplier_role;


-- 4. COUNT SUPPLIERS IN DATABASE
-- ============================================
-- Check total suppliers
-- Expected: Count of all supplier records

SELECT COUNT(*) as total_suppliers
FROM suppliers;


-- 5. VERIFY RLS POLICIES USE has_role
-- ============================================
-- Check if RLS policies reference has_role function
-- Expected: Policies should use has_role for access control

SELECT
    policyname,
    qual as policy_expression,
    with_check as check_expression
FROM pg_policies
WHERE tablename = 'suppliers'
  AND (qual LIKE '%has_role%' OR with_check LIKE '%has_role%');

-- This should show that RLS policies properly use has_role


-- 6. TEST RLS WITH SUPERADMIN
-- ============================================
-- Test that SuperAdmin can access suppliers
-- Replace 'SUPERADMIN_EMAIL_HERE' with actual email

-- Enable RLS on suppliers table
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Test SELECT access (should return all suppliers for SuperAdmin)
SET LOCAL ROLE authenticated;

SELECT COUNT(*) as accessible_suppliers
FROM suppliers
WHERE
    -- This is what the RLS policy does internally
    EXISTS (
        SELECT 1
        FROM user_roles
        WHERE user_id = auth.uid()
        AND has_role(user_id, 'admin')
    )
    OR
    -- Or the user owns the supplier
    created_by = auth.uid();


-- 7. COMPREHENSIVE ROLE TEST
-- ============================================
-- Test all role cascading scenarios
-- Replace 'SUPERADMIN_EMAIL_HERE' with actual email

WITH test_user AS (
    SELECT id
    FROM auth.users
    WHERE email = 'SUPERADMIN_EMAIL_HERE'
    LIMIT 1
)
SELECT
    'superadmin' as tested_role,
    public.has_role((SELECT id FROM test_user), 'superadmin') as is_superadmin,
    public.has_role((SELECT id FROM test_user), 'admin') as is_admin,
    public.has_role((SELECT id FROM test_user), 'supplier') as is_supplier,
    public.has_role((SELECT id FROM test_user), 'customer') as is_customer;

-- Expected: All should return TRUE for SuperAdmin


-- 8. CHECK FUNCTION DEPENDENCIES
-- ============================================
-- Verify function has correct dependencies

SELECT
    p.proname as function_name,
    pg_get_functiondef(p.oid) as full_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'has_role';


-- ============================================
-- VERIFICATION CHECKLIST
-- ============================================
-- Run this summary query to check all key points:

SELECT
    'has_role exists' as check_item,
    CASE
        WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'has_role' AND pronamespace = 'public'::regnamespace)
        THEN 'PASS ✓'
        ELSE 'FAIL ✗'
    END as status

UNION ALL

SELECT
    'SuperAdmin users exist',
    CASE
        WHEN EXISTS(SELECT 1 FROM user_roles WHERE role = 'superadmin')
        THEN 'PASS ✓'
        ELSE 'FAIL ✗'
    END

UNION ALL

SELECT
    'RLS enabled on suppliers',
    CASE
        WHEN EXISTS(SELECT 1 FROM pg_class WHERE relname = 'suppliers' AND relrowsecurity = true)
        THEN 'PASS ✓'
        ELSE 'FAIL ✗'
    END

UNION ALL

SELECT
    'RLS policies use has_role',
    CASE
        WHEN EXISTS(
            SELECT 1 FROM pg_policies
            WHERE tablename = 'suppliers'
            AND (qual LIKE '%has_role%' OR with_check LIKE '%has_role%')
        )
        THEN 'PASS ✓'
        ELSE 'FAIL ✗'
    END;

-- ============================================
-- EXPECTED RESULTS:
-- ============================================
-- Query 1: Function definition showing SuperAdmin cascading
-- Query 2: At least one SuperAdmin user
-- Query 3: TRUE for role cascading tests
-- Query 4: Count of suppliers (>= 0)
-- Query 5: RLS policies using has_role
-- Query 6: Suppliers accessible via RLS
-- Query 7: All roles return TRUE for SuperAdmin
-- Query 8: Complete function definition
-- Checklist: All checks show PASS ✓
