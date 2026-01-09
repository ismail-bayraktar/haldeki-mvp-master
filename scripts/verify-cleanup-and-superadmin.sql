-- ============================================================================
-- POST-CLEANUP VERIFICATION & SUPERADMIN CHECKLIST
-- ============================================================================
-- Purpose: Verify test accounts are deleted and SuperAdmin is properly configured
-- Run this AFTER cleanup-test-accounts-production.sql
-- ============================================================================

-- ============================================================================
-- SECTION 1: VERIFY TEST ACCOUNTS DELETED
-- ============================================================================

DO $$
DECLARE
  v_test_count integer;
  v_test_domains integer;
BEGIN
  -- Count remaining test accounts
  SELECT COUNT(*) INTO v_test_count
  FROM auth.users
  WHERE
    email LIKE '%@test.haldeki.com'
    OR email LIKE '%@test.haldeki.local'
    OR email LIKE '%test@example%'
    OR email LIKE '%@test%'
    OR email IN (
      'test.bayi@haldeki.com',
      'test.tedarikci@haldeki.com',
      'test@haldeki.com',
      'admin@haldeki.local',
      'testuser@example.com'
    );

  -- Count test domain emails
  SELECT COUNT(*) INTO v_test_domains
  FROM public.profiles
  WHERE email LIKE '%@test.haldeki.com' OR email LIKE '%@test.haldeki.local';

  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'TEST ACCOUNT CLEANUP VERIFICATION';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Remaining test accounts in auth.users: %', v_test_count;
  RAISE NOTICE 'Remaining test emails in profiles: %', v_test_domains;

  IF v_test_count = 0 AND v_test_domains = 0 THEN
    RAISE NOTICE 'STATUS: SUCCESS - All test accounts deleted';
  ELSE
    RAISE NOTICE 'STATUS: FAILED - Test accounts still exist!';
  END IF;
  RAISE NOTICE '============================================================================';
END $$;

-- Show any remaining test accounts (if any)
SELECT
  au.id as user_id,
  au.email,
  p.full_name,
  array_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL) as roles,
  au.created_at,
  au.last_sign_in_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
WHERE
  au.email LIKE '%@test.haldeki.com'
  OR au.email LIKE '%@test.haldeki.local'
  OR au.email LIKE '%test@example%'
  OR au.email LIKE '%@test%'
  OR au.email IN (
    'test.bayi@haldeki.com',
    'test.tedarikci@haldeki.com',
    'test@haldeki.com',
    'admin@haldeki.local',
    'testuser@example.com'
  )
GROUP BY au.id, au.email, p.full_name, au.created_at, au.last_sign_in_at;

-- ============================================================================
-- SECTION 2: VERIFY SUPERADMIN ACCOUNT
-- ============================================================================

DO $$
DECLARE
  v_admin_exists boolean;
  v_admin_has_role boolean;
  v_admin_confirmed boolean;
BEGIN
  -- Check if admin@haldeki.com exists
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE email = 'admin@haldeki.com'
  ) INTO v_admin_exists;

  -- Check if admin has superadmin role
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles ur
    JOIN auth.users au ON au.id = ur.user_id
    WHERE au.email = 'admin@haldeki.com' AND ur.role = 'superadmin'
  ) INTO v_admin_has_role;

  -- Check if email is confirmed
  SELECT COALESCE(email_confirmed_at IS NOT NULL, false)
  INTO v_admin_confirmed
  FROM auth.users
  WHERE email = 'admin@haldeki.com';

  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'SUPERADMIN ACCOUNT VERIFICATION';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'admin@haldeki.com exists: %', v_admin_exists;
  RAISE NOTICE 'Has superadmin role: %', v_admin_has_role;
  RAISE NOTICE 'Email confirmed: %', v_admin_confirmed;

  IF v_admin_exists AND v_admin_has_role THEN
    RAISE NOTICE 'STATUS: SUCCESS - SuperAdmin account configured';
  ELSE
    RAISE NOTICE 'STATUS: FAILED - SuperAdmin account incomplete!';
  END IF;
  RAISE NOTICE '============================================================================';
END $$;

-- Show admin account details
SELECT
  au.id as user_id,
  au.email,
  au.email_confirmed_at,
  au.created_at,
  au.last_sign_in_at,
  au.updated_at,
  array_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL) as roles,
  p.full_name,
  p.phone,
  p.avatar_url
FROM auth.users au
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'admin@haldeki.com'
GROUP BY au.id, au.email, au.email_confirmed_at, au.created_at, au.last_sign_in_at, au.updated_at, p.full_name, p.phone, p.avatar_url;

-- ============================================================================
-- SECTION 3: USER ROLE SUMMARY
-- ============================================================================

SELECT
  ur.role,
  COUNT(DISTINCT ur.user_id) as user_count,
  array_agg(DISTINCT au.email) FILTER (WHERE ur.role IN ('superadmin', 'admin')) as admin_emails
FROM public.user_roles ur
LEFT JOIN auth.users au ON au.id = ur.user_id
GROUP BY ur.role
ORDER BY user_count DESC;

-- ============================================================================
-- SECTION 4: DATA INTEGRITY CHECKS
-- ============================================================================

-- Check for orphaned records (no user in auth.users)
DO $$
DECLARE
  v_orphaned_profiles integer;
  v_orphaned_roles integer;
  v_orphaned_dealers integer;
  v_orphaned_suppliers integer;
  v_orphaned_warehouse integer;
BEGIN
  SELECT COUNT(*) INTO v_orphaned_profiles FROM public.profiles p
  LEFT JOIN auth.users au ON au.id = p.id WHERE au.id IS NULL;

  SELECT COUNT(*) INTO v_orphaned_roles FROM public.user_roles ur
  LEFT JOIN auth.users au ON au.id = ur.user_id WHERE au.id IS NULL;

  SELECT COUNT(*) INTO v_orphaned_dealers FROM public.dealers d
  LEFT JOIN auth.users au ON au.id = d.user_id WHERE au.id IS NULL AND d.user_id IS NOT NULL;

  SELECT COUNT(*) INTO v_orphaned_suppliers FROM public.suppliers s
  LEFT JOIN auth.users au ON au.id = s.user_id WHERE au.id IS NULL AND s.user_id IS NOT NULL;

  SELECT COUNT(*) INTO v_orphaned_warehouse FROM public.warehouse_staff ws
  LEFT JOIN auth.users au ON au.id = ws.user_id WHERE au.id IS NULL;

  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'DATA INTEGRITY CHECK';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Orphaned profiles: %', v_orphaned_profiles;
  RAISE NOTICE 'Orphaned user_roles: %', v_orphaned_roles;
  RAISE NOTICE 'Orphaned dealers: %', v_orphaned_dealers;
  RAISE NOTICE 'Orphaned suppliers: %', v_orphaned_suppliers;
  RAISE NOTICE 'Orphaned warehouse_staff: %', v_orphaned_warehouse;

  IF v_orphaned_profiles = 0 AND v_orphaned_roles = 0 AND
     v_orphaned_dealers = 0 AND v_orphaned_suppliers = 0 AND v_orphaned_warehouse = 0 THEN
    RAISE NOTICE 'STATUS: SUCCESS - No orphaned records';
  ELSE
    RAISE NOTICE 'STATUS: WARNING - Orphaned records detected!';
  END IF;
  RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- SECTION 5: SECURITY CHECKLIST
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'SECURITY CHECKLIST - Manual Verification Required';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'SUPERADMIN ACCOUNT:';
  RAISE NOTICE '[ ] Password is 16+ characters with mixed case, numbers, symbols';
  RAISE NOTICE '[ ] Email is confirmed (email_confirmed_at IS NOT NULL)';
  RAISE NOTICE '[ ] MFA enabled in Supabase Dashboard';
  RAISE NOTICE '[ ] Test login successful';
  RAISE NOTICE '[ ] SuperAdmin permissions work correctly';
  RAISE NOTICE '[ ] IP whitelisting configured (if needed)';
  RAISE NOTICE '';
  RAISE NOTICE 'CLEANUP VERIFICATION:';
  RAISE NOTICE '[ ] No test accounts remain (verified above)';
  RAISE NOTICE '[ ] No orphaned records in public tables';
  RAISE NOTICE '[ ] Backup table created: deleted_test_accounts_backup_20250109';
  RAISE NOTICE '[ ] Production data integrity maintained';
  RAISE NOTICE '';
  RAISE NOTICE 'POST-DEPLOYMENT:';
  RAISE NOTICE '[ ] Review Supabase audit logs for suspicious activity';
  RAISE NOTICE '[ ] Monitor for new test account creation attempts';
  RAISE NOTICE '[ ] Delete backup table after 30 days';
  RAISE NOTICE '[ ] Document SuperAdmin credentials securely';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'For issues or questions, contact your database administrator';
  RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- END OF VERIFICATION SCRIPT
-- ============================================================================
