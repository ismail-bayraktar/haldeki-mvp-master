-- ============================================================================
-- SUPERADMIN CREATION MIGRATION
-- Date: 2026-01-10
-- Purpose: Create superadmin@haldeki.com with secure password
-- ============================================================================
-- SECURITY NOTES:
-- - Password: Set via ${SUPERADMIN_PASSWORD} environment variable
-- - Email: admin@haldeki.com
-- - Role: superadmin (full system access)
-- - IMPORTANT: Change password after first login via Supabase Dashboard
-- - NEVER commit actual password to repository
-- ============================================================================

-- ============================================================================
-- STEP 1: CHECK FOR EXISTING SUPERADMIN
-- ============================================================================

DO $$
DECLARE
  v_existing_admin_id uuid;
  v_has_superadmin boolean := false;
BEGIN
  -- Check if admin@haldeki.com exists
  SELECT id INTO v_existing_admin_id
  FROM auth.users
  WHERE email = 'admin@haldeki.com';

  -- Check if anyone has superadmin role
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles WHERE role = 'superadmin'::public.app_role
  ) INTO v_has_superadmin;

  IF v_existing_admin_id IS NOT NULL THEN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Admin account already exists: admin@haldeki.com';
    RAISE NOTICE 'Assigning superadmin role to existing account...';
    RAISE NOTICE '============================================================================';

    -- Remove any existing superadmin roles (single superadmin policy)
    DELETE FROM public.user_roles
    WHERE role = 'superadmin'::public.app_role
      AND user_id != v_existing_admin_id;

    -- Assign superadmin role to admin@haldeki.com
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_existing_admin_id, 'superadmin'::public.app_role)
    ON CONFLICT (user_id, role) DO UPDATE SET role = 'superadmin'::public.app_role;

    -- Create profile if missing
    INSERT INTO public.profiles (id, full_name, phone)
    VALUES (v_existing_admin_id, 'Super Admin', NULL)
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Superadmin role assigned to admin@haldeki.com';
  ELSE
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'ACTION REQUIRED: Create admin@haldeki.com manually';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Step 1: Go to Supabase Dashboard > Authentication > Users';
    RAISE NOTICE 'Step 2: Click "Add User" > "Create New User"';
    RAISE NOTICE 'Step 3: Email: admin@haldeki.com';
    RAISE NOTICE 'Step 4: Password: (Set SUPERADMIN_PASSWORD in .env)';
    RAISE NOTICE 'Step 5: Check "Auto Confirm User"';
    RAISE NOTICE 'Step 6: Click "Create"';
    RAISE NOTICE 'Step 7: Re-run this migration to assign superadmin role';
    RAISE NOTICE '============================================================================';
  END IF;

  -- Report superadmin status
  IF v_has_superadmin THEN
    RAISE NOTICE 'Superadmin role is now assigned';
  ELSE
    RAISE NOTICE 'WARNING: No superadmin exists - create admin@haldeki.com first';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: CREATE PROFILE FOR SUPERADMIN (if user exists)
-- ============================================================================

INSERT INTO public.profiles (id, full_name, phone, created_at, updated_at)
SELECT
  id,
  'Super Admin',
  NULL,
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'admin@haldeki.com'
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  updated_at = NOW();

-- ============================================================================
-- STEP 3: ENSURE SINGLE SUPERADMIN POLICY
-- ============================================================================

-- Remove superadmin role from all other users (only admin@haldeki.com should have it)
DELETE FROM public.user_roles
WHERE role = 'superadmin'::public.app_role
  AND user_id != (SELECT id FROM auth.users WHERE email = 'admin@haldeki.com');

-- ============================================================================
-- STEP 4: AUDIT LOG ENTRY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.admin_audit_log (event_type, description, metadata)
VALUES (
  'superadmin_setup',
  'Superadmin account setup executed',
  jsonb_build_object(
    'email', 'admin@haldeki.com',
    'password_source', 'environment_variable',
    'requires_password_change', true,
    'migration_date', NOW()
  )
);

-- ============================================================================
-- STEP 5: VERIFICATION QUERY
-- ============================================================================

DO $$
DECLARE
  v_admin_count integer;
  v_superadmin_count integer;
BEGIN
  SELECT COUNT(*) INTO v_admin_count
  FROM auth.users
  WHERE email = 'admin@haldeki.com';

  SELECT COUNT(*) INTO v_superadmin_count
  FROM public.user_roles
  WHERE role = 'superadmin'::public.app_role;

  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'SUPERADMIN SETUP VERIFICATION';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'admin@haldeki.com exists: %', v_admin_count > 0;
  RAISE NOTICE 'Superadmin roles assigned: %', v_superadmin_count;
  RAISE NOTICE 'Expected: 1 superadmin (admin@haldeki.com)';
  RAISE NOTICE '============================================================================';

  IF v_admin_count = 0 THEN
    RAISE NOTICE 'ACTION REQUIRED: Create admin@haldeki.com in Supabase Dashboard';
  END IF;

  IF v_superadmin_count > 1 THEN
    RAISE WARNING 'WARNING: Multiple superadmin roles detected - this should not happen';
  END IF;

  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. If admin@haldeki.com does not exist, create it in Supabase Dashboard';
  RAISE NOTICE '2. Re-run this migration to assign superadmin role';
  RAISE NOTICE '3. Login as admin@haldeki.com and change password immediately';
  RAISE NOTICE '4. Enable MFA (Multi-Factor Authentication)';
  RAISE NOTICE '5. Delete test accounts: Run cleanup-test-accounts-production.sql';
  RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- STEP 6: DISPLAY CREDENTIALS (ONE-TIME)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'SUPERADMIN SETUP INSTRUCTIONS';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Email: admin@haldeki.com';
  RAISE NOTICE 'Password: Set SUPERADMIN_PASSWORD in environment variable';
  RAISE NOTICE 'Role: superadmin';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'SECURITY REMINDER:';
  RAISE NOTICE '- Password must be set via environment variable';
  RAISE NOTICE '- CHANGE PASSWORD AFTER FIRST LOGIN';
  RAISE NOTICE '- Enable MFA in Supabase Dashboard > Authentication > Policies';
  RAISE NOTICE '- Store credentials in secure password manager (1Password, Bitwarden)';
  RAISE NOTICE '- NEVER commit password to version control';
  RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- END OF SUPERADMIN CREATION MIGRATION
-- ============================================================================
