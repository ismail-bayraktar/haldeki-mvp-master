-- ============================================================================
-- TEST ACCOUNTS AUDIT QUERY
-- ============================================================================
-- Purpose: Find and document all test accounts in the database
-- Use this to query production/staging for test accounts that shouldn't exist
-- ============================================================================

-- ============================================================================
-- SECTION 1: ALL TEST USERS SUMMARY
-- ============================================================================

SELECT
  au.id as user_id,
  au.email,
  au.created_at,
  au.last_sign_in_at,
  au.updated_at,
  au.email_confirmed_at,
  p.full_name,
  p.phone,
  array_agg(ur.role) as roles,
  CASE
    WHEN au.email LIKE '%@test.haldeki.com' THEN '@test.haldeki.com'
    WHEN au.email LIKE '%@test.haldeki.local' THEN '@test.haldeki.local'
    WHEN au.email LIKE '%test%' THEN 'Contains "test"'
    ELSE 'Other'
  END as test_domain
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
WHERE
  au.email LIKE '%@test.haldeki.com'
  OR au.email LIKE '%@test.haldeki.local'
  OR au.email LIKE '%test@example%'
  OR au.email LIKE '%test%'
  OR p.email LIKE '%@test.haldeki.com'
  OR p.email LIKE '%@test.haldeki.local'
GROUP BY
  au.id, au.email, au.created_at, au.last_sign_in_at,
  au.updated_at, au.email_confirmed_at, p.full_name, p.phone
ORDER BY au.created_at;

-- ============================================================================
-- SECTION 2: TEST USERS WITH ROLES AND DETAILS
-- ============================================================================

SELECT
  au.id as user_id,
  au.email,
  p.full_name,
  p.phone,
  array_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL) as roles,
  d.name as dealer_name,
  d.approval_status as dealer_status,
  s.name as supplier_name,
  s.approval_status as supplier_status,
  b.company_name as business_name,
  b.approval_status as business_status,
  au.created_at,
  au.last_sign_in_at,
  au.email_confirmed_at,
  CASE
    WHEN au.email LIKE '%@test.haldeki.com' THEN 'Production Test Domain'
    WHEN au.email LIKE '%@test.haldeki.local' THEN 'Local Test Domain'
    ELSE 'Other Test Pattern'
  END as test_type,
  CASE
    WHEN au.last_sign_in_at IS NULL THEN 'Never Logged In'
    WHEN au.last_sign_in_at < NOW() - INTERVAL '30 days' THEN 'Inactive (30+ days)'
    ELSE 'Active'
  END as activity_status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
LEFT JOIN public.dealers d ON d.user_id = au.id
LEFT JOIN public.suppliers s ON s.user_id = au.id
LEFT JOIN public.businesses b ON b.user_id = au.id
WHERE
  au.email LIKE '%@test.haldeki.com'
  OR au.email LIKE '%@test.haldeki.local'
  OR au.email LIKE '%test@example%'
GROUP BY
  au.id, au.email, p.full_name, p.phone,
  d.name, d.approval_status,
  s.name, s.approval_status,
  b.company_name, b.approval_status,
  au.created_at, au.last_sign_in_at, au.email_confirmed_at
ORDER BY au.created_at;

-- ============================================================================
-- SECTION 3: WAREHOUSE STAFF TEST ACCOUNTS
-- ============================================================================

SELECT
  au.id as user_id,
  au.email,
  p.full_name,
  p.phone,
  ws.vendor_id,
  v.name as vendor_name,
  ws.is_active,
  au.created_at,
  au.last_sign_in_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
LEFT JOIN public.user_roles ur ON ur.user_id = au.id AND ur.role = 'warehouse_staff'
LEFT JOIN public.warehouse_staff ws ON ws.user_id = au.id
LEFT JOIN public.vendors v ON v.id = ws.vendor_id
WHERE
  (au.email LIKE '%@test.haldeki.com' OR au.email LIKE '%@test.haldeki.local')
  AND ur.role = 'warehouse_staff'
ORDER BY au.created_at;

-- ============================================================================
-- SECTION 4: TEST ACCOUNTS COUNT BY ROLE
-- ============================================================================

SELECT
  ur.role,
  COUNT(DISTINCT au.id) as count,
  array_agg(DISTINCT au.email) as emails
FROM auth.users au
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
WHERE
  au.email LIKE '%@test.haldeki.com'
  OR au.email LIKE '%@test.haldeki.local'
  OR au.email LIKE '%test@example%'
GROUP BY ur.role
ORDER BY count DESC;

-- ============================================================================
-- SECTION 5: SECURITY RISK ASSESSMENT
-- ============================================================================

SELECT
  au.email,
  array_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL) as roles,
  au.email_confirmed_at as email_verified,
  au.last_sign_in_at as last_login,
  CASE
    WHEN au.email_confirmed_at IS NULL THEN 'HIGH - Unconfirmed email'
    WHEN array_length(array_agg(ur.role) FILTER (WHERE ur.role IN ('superadmin', 'admin')), 1) > 0 THEN 'HIGH - Admin privileges'
    WHEN au.last_sign_in_at IS NULL THEN 'MEDIUM - Never logged in'
    WHEN au.last_sign_in_at < NOW() - INTERVAL '90 days' THEN 'LOW - Inactive'
    ELSE 'MEDIUM - Standard test account'
  END as risk_level,
  CASE
    WHEN au.email LIKE '%@test.haldeki.com' THEN 'Remove before production'
    WHEN au.email LIKE '%@test.haldeki.local' THEN 'Dev environment only'
    ELSE 'Review needed'
  END as recommendation
FROM auth.users au
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
WHERE
  au.email LIKE '%@test.haldeki.com'
  OR au.email LIKE '%@test.haldeki.local'
  OR au.email LIKE '%test@example%'
GROUP BY
  au.id, au.email, au.email_confirmed_at, au.last_sign_in_at
ORDER BY
  CASE
    WHEN array_length(array_agg(ur.role) FILTER (WHERE ur.role IN ('superadmin', 'admin')), 1) > 0 THEN 1
    WHEN au.email_confirmed_at IS NULL THEN 2
    WHEN au.last_sign_in_at IS NULL THEN 3
    ELSE 4
  END;

-- ============================================================================
-- SECTION 6: DELETE COMMANDS (USE WITH CAUTION)
-- ============================================================================

-- WARNING: These commands will permanently delete test accounts!
-- Review the output above carefully before running any DELETE commands.

-- To delete a specific test account (replace UUID):
-- DELETE FROM public.profiles WHERE id = 'USER_UUID';
-- DELETE FROM public.user_roles WHERE user_id = 'USER_UUID';
-- DELETE FROM public.dealers WHERE user_id = 'USER_UUID';
-- DELETE FROM public.suppliers WHERE user_id = 'USER_UUID';
-- DELETE FROM public.businesses WHERE user_id = 'USER_UUID';
-- DELETE FROM public.warehouse_staff WHERE user_id = 'USER_UUID';
-- DELETE FROM auth.users WHERE id = 'USER_UUID';

-- To delete ALL test accounts (DANGEROUS - review carefully first):
-- DELETE FROM public.profiles WHERE email LIKE '%@test.haldeki.com';
-- DELETE FROM public.user_roles WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@test.haldeki.com');
-- DELETE FROM public.dealers WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@test.haldeki.com');
-- DELETE FROM public.suppliers WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@test.haldeki.com');
-- DELETE FROM public.businesses WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@test.haldeki.com');
-- DELETE FROM auth.users WHERE email LIKE '%@test.haldeki.com';

-- ============================================================================
-- END OF AUDIT QUERY
-- ============================================================================
