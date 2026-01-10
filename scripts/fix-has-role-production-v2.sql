-- =====================================================
-- FIX: Restore SuperAdmin Role Bypass (NO DROP NEEDED)
-- =====================================================
-- Date: 2026-01-09
-- Issue: "Tedarikçi kaydı bulunamadı" error
-- Solution: CREATE OR REPLACE (preserves RLS policies)
-- =====================================================
--
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Copy and paste this script
-- 3. Click "Run"
-- 4. Look for success message
--
-- =====================================================

-- Direct CREATE OR REPLACE - no DROP needed!
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Check if user has the exact role
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  ) THEN
    RETURN true;
  END IF;

  -- Superadmin cascading: superadmin has all roles
  IF _role != 'superadmin' AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'superadmin'
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Add documentation
COMMENT ON FUNCTION public.has_role IS 'Checks if user has role. SuperAdmins have cascading access to all roles except superadmin role itself.';

-- Verify it worked
DO $$
BEGIN
  RAISE NOTICE '✓ has_role function updated successfully! SuperAdmins now have cascading permissions.';
END $$;

-- =====================================================
-- VERIFICATION (Optional - Run these to test)
-- =====================================================

-- Test 1: Check function exists
-- SELECT prosrc FROM pg_proc WHERE proname = 'has_role' AND pronamespace = 'public'::regnamespace;

-- Test 2: Verify SuperAdmin cascading (replace email)
-- SELECT public.has_role(
--   (SELECT id FROM auth.users WHERE email = 'YOUR_SUPERADMIN_EMAIL'),
--   'admin'
-- );
-- Expected: true

-- Test 3: Count affected SuperAdmins
-- SELECT COUNT(*) FROM user_roles WHERE role = 'superadmin';
