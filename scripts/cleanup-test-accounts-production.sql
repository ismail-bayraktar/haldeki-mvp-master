-- ============================================================================
-- PRODUCTION TEST ACCOUNTS CLEANUP
-- ============================================================================
-- WARNING: This script will PERMANENTLY delete all test accounts
-- Run the audit script first to review what will be deleted
-- Usage:
--   1. Run audit-test-accounts.sql to see all test accounts
--   2. Review the output carefully
--   3. Run this script to delete them
-- ============================================================================

-- ============================================================================
-- STEP 1: CONFIRMATION SAFETY CHECK
-- ============================================================================

-- This will show you what will be deleted
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'PRODUCTION TEST ACCOUNTS CLEANUP';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'This script will delete ALL test accounts matching:';
  RAISE NOTICE '  - %@test.haldeki.com';
  RAISE NOTICE '  - %@test.haldeki.local';
  RAISE NOTICE '  - %test@example%';
  RAISE NOTICE '';
  RAISE NOTICE 'Press Ctrl+C now to abort, or wait 5 seconds to continue...';
  RAISE NOTICE '============================================================================';
END $$;

-- Add a delay to allow cancellation (PostgreSQL doesn't have sleep, use pg_sleep)
SELECT pg_sleep(5);

-- ============================================================================
-- STEP 2: BACKUP DATA (Optional but Recommended)
-- ============================================================================

-- Create a backup table before deletion
CREATE TABLE IF NOT EXISTS public.deleted_test_accounts_backup AS
SELECT
  au.id as user_id,
  au.email,
  au.created_at,
  au.last_sign_in_at,
  au.email_confirmed_at,
  p.full_name,
  p.phone,
  array_agg(ur.role) as roles,
  d.name as dealer_name,
  s.name as supplier_name,
  b.company_name as business_name,
  NOW() as deleted_at
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
  au.id, au.email, au.created_at, au.last_sign_in_at, au.email_confirmed_at,
  p.full_name, p.phone, d.name, s.name, b.company_name;

RAISE NOTICE 'Backup created: public.deleted_test_accounts_backup';

-- ============================================================================
-- STEP 3: DELETE TEST ACCOUNTS
-- ============================================================================

-- Count before deletion
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM auth.users
  WHERE email LIKE '%@test.haldeki.com'
    OR email LIKE '%@test.haldeki.local'
    OR email LIKE '%test@example%';

  RAISE NOTICE 'Found % test accounts to delete', v_count;
END $$;

-- 3.1 Delete from warehouse_staff
DELETE FROM public.warehouse_staff
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email LIKE '%@test.haldeki.com'
    OR email LIKE '%@test.haldeki.local'
    OR email LIKE '%test@example%'
);
RAISE NOTICE 'Deleted from warehouse_staff';

-- 3.2 Delete from businesses
DELETE FROM public.businesses
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email LIKE '%@test.haldeki.com'
    OR email LIKE '%@test.haldeki.local'
    OR email LIKE '%test@example%'
);
RAISE NOTICE 'Deleted from businesses';

-- 3.3 Delete from suppliers
DELETE FROM public.suppliers
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email LIKE '%@test.haldeki.com'
    OR email LIKE '%@test.haldeki.local'
    OR email LIKE '%test@example%'
);
RAISE NOTICE 'Deleted from suppliers';

-- 3.4 Delete from dealers
DELETE FROM public.dealers
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email LIKE '%@test.haldeki.com'
    OR email LIKE '%@test.haldeki.local'
    OR email LIKE '%test@example%'
);
RAISE NOTICE 'Deleted from dealers';

-- 3.5 Delete from user_roles
DELETE FROM public.user_roles
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email LIKE '%@test.haldeki.com'
    OR email LIKE '%@test.haldeki.local'
    OR email LIKE '%test@example%'
);
RAISE NOTICE 'Deleted from user_roles';

-- 3.6 Delete from profiles
DELETE FROM public.profiles
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email LIKE '%@test.haldeki.com'
    OR email LIKE '%@test.haldeki.local'
    OR email LIKE '%test@example%'
);
RAISE NOTICE 'Deleted from profiles';

-- 3.7 Delete from auth.users (Last - cascade will handle related data)
DELETE FROM auth.users
WHERE email LIKE '%@test.haldeki.com'
  OR email LIKE '%@test.haldeki.local'
  OR email LIKE '%test@example%';
RAISE NOTICE 'Deleted from auth.users';

-- ============================================================================
-- STEP 4: VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_remaining integer;
BEGIN
  SELECT COUNT(*) INTO v_remaining
  FROM auth.users
  WHERE email LIKE '%@test.haldeki.com'
    OR email LIKE '%@test.haldeki.local'
    OR email LIKE '%test@example%';

  IF v_remaining = 0 THEN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'SUCCESS: All test accounts have been deleted';
    RAISE NOTICE '============================================================================';
  ELSE
    RAISE NOTICE 'WARNING: % test accounts remain', v_remaining;
    RAISE NOTICE 'Review the logs above for details';
  END IF;
END $$;

-- ============================================================================
-- STEP 5: SUMMARY
-- ============================================================================

-- Show what was backed up
SELECT
  email,
  full_name,
  roles,
  deleted_at
FROM public.deleted_test_accounts_backup
ORDER BY deleted_at DESC;

RAISE NOTICE '============================================================================';
RAISE NOTICE 'CLEANUP COMPLETE';
RAISE NOTICE '============================================================================';
RAISE NOTICE '';
RAISE NOTICE 'Backup table: public.deleted_test_accounts_backup';
RAISE NOTICE 'To restore (if needed): Restore from backup table manually';
RAISE NOTICE 'To drop backup: DROP TABLE IF EXISTS public.deleted_test_accounts_backup;';
RAISE NOTICE '============================================================================';

-- ============================================================================
-- END OF CLEANUP SCRIPT
-- ============================================================================
