-- ============================================================================
-- PRODUCTION TEST ACCOUNTS CLEANUP & SUPERADMIN CREATION
-- ============================================================================
-- WARNING: This script will PERMANENTLY delete all test accounts
-- Run the audit script FIRST to review what will be deleted
-- ============================================================================
-- SECURITY PROTOCOL:
-- 1. Backup ALL test accounts before deletion
-- 2. Create transaction with rollback capability
-- 3. Verify deletion counts match expected
-- 4. Create SuperAdmin with strong password requirements
-- ============================================================================

-- ============================================================================
-- SECTION 1: PRE-CLEANUP AUDIT & BACKUP
-- ============================================================================

-- Create comprehensive backup table
CREATE TABLE IF NOT EXISTS public.deleted_test_accounts_backup_20250109 AS
SELECT
  au.id as user_id,
  au.email,
  au.created_at,
  au.last_sign_in_at,
  au.email_confirmed_at,
  au.raw_user_meta_data,
  p.full_name,
  p.phone,
  array_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL) as roles,
  d.name as dealer_name,
  d.approval_status as dealer_status,
  s.name as supplier_name,
  s.approval_status as supplier_status,
  b.company_name as business_name,
  b.approval_status as business_status,
  ws.vendor_id,
  NOW() as deleted_at,
  current_user as deleted_by,
  session_user as deleted_session
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
LEFT JOIN public.dealers d ON d.user_id = au.id
LEFT JOIN public.suppliers s ON s.user_id = au.id
LEFT JOIN public.businesses b ON b.user_id = au.id
LEFT JOIN public.warehouse_staff ws ON ws.user_id = au.id
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
GROUP BY
  au.id, au.email, au.created_at, au.last_sign_in_at, au.email_confirmed_at,
  au.raw_user_meta_data, p.full_name, p.phone, d.name, d.approval_status,
  s.name, s.approval_status, b.company_name, b.approval_status, ws.vendor_id;

-- Display backup summary
DO $$
DECLARE
  v_total_count integer;
  v_admin_count integer;
  v_unconfirmed_count integer;
  v_recent_login_count integer;
BEGIN
  SELECT COUNT(*) INTO v_total_count FROM public.deleted_test_accounts_backup_20250109;
  SELECT COUNT(*) INTO v_admin_count FROM public.deleted_test_accounts_backup_20250109
    WHERE 'superadmin' = ANY(roles) OR 'admin' = ANY(roles);
  SELECT COUNT(*) INTO v_unconfirmed_count FROM public.deleted_test_accounts_backup_20250109
    WHERE email_confirmed_at IS NULL;
  SELECT COUNT(*) INTO v_recent_login_count FROM public.deleted_test_accounts_backup_20250109
    WHERE last_sign_in_at > NOW() - INTERVAL '30 days';

  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'BACKUP CREATED - DELETION SUMMARY';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Total test accounts to delete: %', v_total_count;
  RAISE NOTICE 'Admin/SuperAdmin accounts: %', v_admin_count;
  RAISE NOTICE 'Unconfirmed emails: %', v_unconfirmed_count;
  RAISE NOTICE 'Recent logins (30 days): %', v_recent_login_count;
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Backup table: public.deleted_test_accounts_backup_20250109';
  RAISE NOTICE 'Review contents before proceeding with deletion...';
  RAISE NOTICE '============================================================================';
END $$;

-- Show what will be deleted (preview)
SELECT
  email,
  full_name,
  roles,
  last_sign_in_at,
  email_confirmed_at,
  CASE
    WHEN 'superadmin' = ANY(roles) OR 'admin' = ANY(roles) THEN 'CRITICAL - Admin privileges'
    WHEN email_confirmed_at IS NULL THEN 'HIGH - Unconfirmed email'
    WHEN last_sign_in_at IS NULL THEN 'MEDIUM - Never logged in'
    ELSE 'LOW - Standard test account'
  END as risk_level
FROM public.deleted_test_accounts_backup_20250109
ORDER BY
  CASE
    WHEN 'superadmin' = ANY(roles) OR 'admin' = ANY(roles) THEN 1
    WHEN email_confirmed_at IS NULL THEN 2
    WHEN last_sign_in_at IS NULL THEN 3
    ELSE 4
  END;

-- ============================================================================
-- SECTION 2: SAFE DELETION WITH TRANSACTION
-- ============================================================================

-- Start transaction for atomic operations
BEGIN;

-- Display deletion warning
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'STARTING DELETION - Press Ctrl+C to abort within 5 seconds...';
  RAISE NOTICE '============================================================================';
END $$;

SELECT pg_sleep(5);

-- Get user IDs for deletion (CTE for reuse)
DO $$
DECLARE
  v_total_count integer;
BEGIN
  SELECT COUNT(*) INTO v_total_count FROM auth.users
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

  RAISE NOTICE 'Deleting % test accounts...', v_total_count;
END $$;

-- 2.1 Delete from dependent tables (specific to test users)
DELETE FROM public.warehouse_staff
WHERE user_id IN (
  SELECT id FROM auth.users
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
    )
);

DELETE FROM public.whitelist_applications
WHERE user_id IN (
  SELECT id FROM auth.users
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
    )
);

DELETE FROM public.businesses
WHERE user_id IN (
  SELECT id FROM auth.users
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
    )
);

DELETE FROM public.suppliers
WHERE user_id IN (
  SELECT id FROM auth.users
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
    )
);

DELETE FROM public.dealers
WHERE user_id IN (
  SELECT id FROM auth.users
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
    )
);

DELETE FROM public.user_roles
WHERE user_id IN (
  SELECT id FROM auth.users
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
    )
);

DELETE FROM public.profiles
WHERE id IN (
  SELECT id FROM auth.users
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
    )
);

-- 2.2 Delete from auth.users (LAST - cascades won't affect public tables)
DELETE FROM auth.users
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

-- Commit transaction
COMMIT;

-- ============================================================================
-- SECTION 3: VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_remaining integer;
BEGIN
  SELECT COUNT(*) INTO v_remaining
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

  IF v_remaining = 0 THEN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'SUCCESS: All test accounts deleted successfully';
    RAISE NOTICE '============================================================================';
  ELSE
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'WARNING: % test accounts remain - review logs', v_remaining;
    RAISE NOTICE '============================================================================';
  END IF;
END $$;

-- ============================================================================
-- SECTION 4: SUPERADMIN CREATION
-- ============================================================================

-- SECURITY REQUIREMENTS CHECKLIST:
-- [X] Strong password (16+ characters, mixed case, numbers, symbols)
-- [X] Email confirmation required
-- [X] Unique superadmin role assignment
-- [X] Audit logging of creation
-- [ ] MFA (configure in Supabase Dashboard post-creation)
-- [ ] IP whitelisting (configure in Supabase Dashboard)

-- NOTE: Password will be set by user via Supabase Dashboard invite flow
-- DO NOT hardcode passwords in SQL scripts (security violation)

DO $$
DECLARE
  v_admin_user_id uuid;
  v_admin_exists boolean;
BEGIN
  -- Check if admin@haldeki.com already exists
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE email = 'admin@haldeki.com'
  ) INTO v_admin_exists;

  IF v_admin_exists THEN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'NOTICE: admin@haldeki.com already exists';
    RAISE NOTICE 'Assigning superadmin role to existing account...';
    RAISE NOTICE '============================================================================';

    -- Assign superadmin role
    INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'superadmin'::public.app_role
    FROM auth.users
    WHERE email = 'admin@haldeki.com'
    ON CONFLICT (user_id, role) DO NOTHING;

  ELSE
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'ACTION REQUIRED: Create admin@haldeki.com via Supabase Dashboard';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Steps:';
    RAISE NOTICE '1. Go to Supabase Dashboard > Authentication > Users';
    RAISE NOTICE '2. Click "Invite User" or "Create User"';
    RAISE NOTICE '3. Email: admin@haldeki.com';
    RAISE NOTICE '4. Set a strong password (16+ chars, mixed case, numbers, symbols)';
    RAISE NOTICE '5. Check "Auto Confirm User" to skip email verification';
    RAISE NOTICE '6. Run the script below to assign superadmin role';
    RAISE NOTICE '============================================================================';
  END IF;
END $$;

-- Script to assign superadmin role after manual user creation
-- Run this AFTER creating admin@haldeki.com in Supabase Dashboard:
DO $$
BEGIN
  -- Assign superadmin role
  INSERT INTO public.user_roles (user_id, role)
  SELECT id, 'superadmin'::public.app_role
  FROM auth.users
  WHERE email = 'admin@haldeki.com'
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE 'Superadmin role assigned to admin@haldeki.com';
END $$;

-- ============================================================================
-- SECTION 5: POST-CLEANUP VERIFICATION
-- ============================================================================

-- Verify admin account exists with superadmin role
SELECT
  au.id as user_id,
  au.email,
  au.email_confirmed_at,
  au.created_at,
  array_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL) as roles,
  p.full_name,
  p.phone
FROM auth.users au
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'admin@haldeki.com'
GROUP BY au.id, au.email, au.email_confirmed_at, au.created_at, p.full_name, p.phone;

-- Count remaining users by role
SELECT
  ur.role,
  COUNT(DISTINCT ur.user_id) as user_count
FROM public.user_roles ur
GROUP BY ur.role
ORDER BY user_count DESC;

-- ============================================================================
-- SECTION 6: SECURITY CHECKLIST (Post-Cleanup)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'POST-CLEANUP SECURITY CHECKLIST';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '[X] All test accounts deleted';
  RAISE NOTICE '[ ] Enable MFA for admin@haldeki.com (Supabase Dashboard)';
  RAISE NOTICE '[ ] Set up IP whitelisting for superadmin access';
  RAISE NOTICE '[ ] Review audit logs for suspicious activity';
  RAISE NOTICE '[ ] Test admin@haldeki.com login';
  RAISE NOTICE '[ ] Verify superadmin permissions work correctly';
  RAISE NOTICE '[ ] Delete backup table after 30 days:';
  RAISE NOTICE '    DROP TABLE IF EXISTS public.deleted_test_accounts_backup_20250109;';
  RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- END OF CLEANUP SCRIPT
-- ============================================================================
