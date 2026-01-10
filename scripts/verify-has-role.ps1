# has_role Function Verification Guide
# Run these queries manually in Supabase SQL Editor

Write-Host "=== has_role Function Verification ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Follow these steps to verify the has_role fix:" -ForegroundColor Yellow
Write-Host ""

Write-Host "STEP 1: Open Supabase SQL Editor" -ForegroundColor Green
Write-Host "  - Go to https://app.supabase.com"
Write-Host "  - Select your project"
Write-Host "  - Click SQL Editor in left sidebar"
Write-Host "  - Click New Query"
Write-Host ""

Write-Host "STEP 2: Run Core Verification Query" -ForegroundColor Green
Write-Host "  Copy and paste this SQL:" -ForegroundColor Yellow
Write-Host ""
Write-Host @"
SELECT
    'has_role exists' as check_item,
    CASE
        WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'has_role' AND pronamespace = 'public'::regnamespace)
        THEN 'PASS [OK]'
        ELSE 'FAIL [X]'
    END as status

UNION ALL

SELECT
    'SuperAdmin users exist',
    CASE
        WHEN EXISTS(SELECT 1 FROM user_roles WHERE role = 'superadmin')
        THEN 'PASS [OK]'
        ELSE 'FAIL [X]'
    END

UNION ALL

SELECT
    'RLS enabled on suppliers',
    CASE
        WHEN EXISTS(SELECT 1 FROM pg_class WHERE relname = 'suppliers' AND relrowsecurity = true)
        THEN 'PASS [OK]'
        ELSE 'FAIL [X]'
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
        THEN 'PASS [OK]'
        ELSE 'FAIL [X]'
    END;
"@

Write-Host ""
Write-Host "  Expected: All 4 checks show 'PASS [OK]'" -ForegroundColor Cyan
Write-Host ""

Write-Host "STEP 3: Test SuperAdmin Cascading" -ForegroundColor Green
Write-Host "  First, find a SuperAdmin user:" -ForegroundColor Yellow
Write-Host ""
Write-Host @"
SELECT u.email, ur.role
FROM auth.users u
JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.role = 'superadmin'
LIMIT 1;
"@

Write-Host ""
Write-Host "  Then test with that email (replace EMAIL_HERE):" -ForegroundColor Yellow
Write-Host ""
Write-Host @"
SELECT
    public.has_role(
        (SELECT id FROM auth.users WHERE email = 'EMAIL_HERE'),
        'admin'
    ) as superadmin_has_admin;
"@

Write-Host ""
Write-Host "  Expected: true (SuperAdmin should cascade to admin)" -ForegroundColor Cyan
Write-Host ""

Write-Host "STEP 4: Count Suppliers" -ForegroundColor Green
Write-Host "  Verify suppliers are accessible:" -ForegroundColor Yellow
Write-Host ""
Write-Host @"
SELECT COUNT(*) as total_suppliers FROM suppliers;
"@

Write-Host ""
Write-Host "  Expected: Number of supplier records in database" -ForegroundColor Cyan
Write-Host ""

Write-Host "STEP 5: Check Function Definition" -ForegroundColor Green
Write-Host "  Verify the function source code:" -ForegroundColor Yellow
Write-Host ""
Write-Host @"
SELECT prosrc
FROM pg_proc
WHERE proname = 'has_role'
  AND pronamespace = 'public'::regnamespace;
"@

Write-Host ""
Write-Host "  Expected: Function source showing SuperAdmin cascading logic" -ForegroundColor Cyan
Write-Host ""

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "ASSESSMENT CRITERIA:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Overall Status: PASS if all of the above:" -ForegroundColor White
Write-Host "    - has_role function exists" -ForegroundColor Green
Write-Host "    - SuperAdmin users exist in database" -ForegroundColor Green
Write-Host "    - RLS is enabled on suppliers table" -ForegroundColor Green
Write-Host "    - RLS policies use has_role function" -ForegroundColor Green
Write-Host "    - SuperAdmin cascades to admin role (returns true)" -ForegroundColor Green
Write-Host ""
Write-Host "  Overall Status: FAIL if any check fails" -ForegroundColor Red
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Full verification script saved to:" -ForegroundColor Yellow
Write-Host "  supabase/migrations/20260110120000_verify_has_role_fix.sql" -ForegroundColor White
