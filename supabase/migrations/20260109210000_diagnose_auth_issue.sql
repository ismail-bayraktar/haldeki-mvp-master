-- ============================================================================
-- DIAGNOSTIC SCRIPT - AUTH 400 ERROR
-- Date: 2026-01-09
-- Purpose: Diagnose why login returns 400 "Invalid login credentials"
-- ============================================================================
-- This script checks:
-- 1. Do users exist in auth.users?
-- 2. Is email_confirmed_at set?
-- 3. What is the password hash format?
-- 4. Are there any auth configuration issues?
-- ============================================================================

SET search_path = auth, public;

-- ============================================================================
-- CHECK 1: USER EXISTENCE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'CHECK 1: USER EXISTENCE IN auth.users';
  RAISE NOTICE '============================================================================';
END $$;

SELECT
  'admin@haldeki.com' as email,
  EXISTS(SELECT 1 FROM auth.users WHERE email = 'admin@haldeki.com') as exists,
  (SELECT id FROM auth.users WHERE email = 'admin@haldeki.com') as user_id
UNION ALL
SELECT
  'superadmin@test.haldeki.com',
  EXISTS(SELECT 1 FROM auth.users WHERE email = 'superadmin@test.haldeki.com'),
  (SELECT id FROM auth.users WHERE email = 'superadmin@test.haldeki.com')
UNION ALL
SELECT
  'supplier-approved@test.haldeki.com',
  EXISTS(SELECT 1 FROM auth.users WHERE email = 'supplier-approved@test.haldeki.com'),
  (SELECT id FROM auth.users WHERE email = 'supplier-approved@test.haldeki.com');

-- ============================================================================
-- CHECK 2: EMAIL CONFIRMATION STATUS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'CHECK 2: EMAIL CONFIRMATION STATUS';
  RAISE NOTICE '============================================================================';
END $$;

SELECT
  email,
  created_at,
  email_confirmed_at,
  CASE
    WHEN email_confirmed_at IS NULL THEN 'NOT CONFIRMED ❌'
    ELSE 'CONFIRMED ✅'
  END as confirmation_status,
  last_sign_in_at
FROM auth.users
WHERE email IN (
  'admin@haldeki.com',
  'superadmin@test.haldeki.com',
  'supplier-approved@test.haldeki.com'
)
ORDER BY email;

-- ============================================================================
-- CHECK 3: PASSWORD HASH FORMAT
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'CHECK 3: PASSWORD HASH INFORMATION';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Note: Actual password hashes are NOT displayed for security';
  RAISE NOTICE 'We only check if a hash exists and its format';
END $$;

SELECT
  email,
  CASE
    WHEN encrypted_password IS NULL THEN 'NULL ❌ - CRITICAL ISSUE'
    WHEN encrypted_password = '' THEN 'EMPTY ❌ - CRITICAL ISSUE'
    WHEN encrypted_password LIKE '$2b$%' THEN 'BCRYPT ✅ (format: $2b$)'
    WHEN encrypted_password LIKE '$2a$%' THEN 'BCRYPT ✅ (format: $2a$)'
    ELSE 'UNKNOWN FORMAT ⚠️: ' || SUBSTRING(encrypted_password, 1, 10)
  END as password_hash_status,
  LENGTH(encrypted_password) as hash_length,
  updated_at
FROM auth.users
WHERE email IN (
  'admin@haldeki.com',
  'superadmin@test.haldeki.com',
  'supplier-approved@test.haldeki.com'
)
ORDER BY email;

-- ============================================================================
-- CHECK 4: USER METADATA
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'CHECK 4: USER METADATA';
  RAISE NOTICE '============================================================================';
END $$;

SELECT
  u.email,
  u.raw_user_meta_data->>'full_name' as full_name,
  u.raw_user_meta_data->>'role' as role,
  u.raw_app_meta_data->>'provider' as provider,
  u.phone,
  u.phone_verified,
  u.aud,
  u.role
FROM auth.users u
WHERE u.email IN (
  'admin@haldeki.com',
  'superadmin@test.haldeki.com',
  'supplier-approved@test.haldeki.com'
)
ORDER BY u.email;

-- ============================================================================
-- CHECK 5: PROFILE AND ROLE STATUS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'CHECK 5: PUBLIC SCHEMA STATUS';
  RAISE NOTICE '============================================================================';
END $$;

SET search_path = public;

SELECT
  u.email,
  p.id as profile_exists,
  r.role as assigned_role,
  s.id as supplier_exists,
  s.approval_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles r ON u.id = r.user_id
LEFT JOIN public.suppliers s ON u.id = s.user_id
WHERE u.email IN (
  'admin@haldeki.com',
  'superadmin@test.haldeki.com',
  'supplier-approved@test.haldeki.com'
)
ORDER BY u.email;

-- ============================================================================
-- CHECK 6: SUPABASE AUTH SETTINGS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'CHECK 6: SUPABASE AUTH CONFIGURATION';
  RAISE NOTICE '============================================================================';
END $$;

-- Check if there's an auth.settings table (Supabase version dependent)
DO $$
DECLARE
  v_settings_table_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth'
    AND table_name = 'settings'
  ) INTO v_settings_table_exists;

  IF v_settings_table_exists THEN
    RAISE NOTICE 'auth.settings table exists';
  ELSE
    RAISE NOTICE 'auth.settings table does not exist (older Supabase version)';
  END IF;
END $$;

-- ============================================================================
-- SUMMARY OF ISSUES
-- ============================================================================

DO $$
DECLARE
  v_issue_count INTEGER := 0;
  v_user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_user_count
  FROM auth.users
  WHERE email IN (
    'admin@haldeki.com',
    'superadmin@test.haldeki.com',
    'supplier-approved@test.haldeki.com'
  );

  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'DIAGNOSTIC SUMMARY';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Total users found: %', v_user_count;

  IF v_user_count < 3 THEN
    RAISE NOTICE '❌ ISSUE: Not all users exist in auth.users';
    v_issue_count := v_issue_count + 1;
  END IF;

  -- Check for unconfirmed emails
  IF EXISTS(SELECT 1 FROM auth.users WHERE email_confirmed_at IS NULL AND email IN ('admin@haldeki.com', 'superadmin@test.haldeki.com', 'supplier-approved@test.haldeki.com')) THEN
    RAISE NOTICE '❌ ISSUE: Some users have unconfirmed emails';
    v_issue_count := v_issue_count + 1;
  END IF;

  -- Check for missing password hashes
  IF EXISTS(SELECT 1 FROM auth.users WHERE (encrypted_password IS NULL OR encrypted_password = '') AND email IN ('admin@haldeki.com', 'superadmin@test.haldeki.com', 'supplier-approved@test.haldeki.com')) THEN
    RAISE NOTICE '❌ ISSUE: Some users have missing password hashes';
    v_issue_count := v_issue_count + 1;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Total issues found: %', v_issue_count;
  RAISE NOTICE '============================================================================';
END $$;
