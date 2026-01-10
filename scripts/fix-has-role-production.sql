-- =====================================================
-- EMERGENCY FIX: Restore SuperAdmin Role Bypass
-- =====================================================
-- Date: 2026-01-09
-- Issue: "Tedarikçi kaydı bulunamadı" error
-- Root Cause: has_role() function lost SuperAdmin cascading
-- =====================================================
--
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Copy and paste this entire script
-- 3. Click "Run" to execute
-- 4. Verify success by testing /tedarikci route
--
-- =====================================================

-- Step 1: Drop the broken has_role function
DROP FUNCTION IF EXISTS public.has_role(_user_id uuid, _role public.app_role);

-- Step 2: Recreate with SuperAdmin cascading permissions
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

-- Step 3: Add documentation
COMMENT ON FUNCTION public.has_role IS 'Checks if user has role. SuperAdmins have cascading access to all roles except superadmin role itself.';

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Step 5: Verify the fix
-- This should return 't' (true) for SuperAdmin users
DO $$
DECLARE
  v_superadmin_count int;
BEGIN
  -- Count how many SuperAdmins now have 'admin' role via cascading
  SELECT COUNT(*) INTO v_superadmin_count
  FROM user_roles ur
  WHERE ur.role = 'superadmin'
    AND public.has_role(ur.user_id, 'admin'::public.app_role);

  RAISE NOTICE 'SuperAdmin role bypass restored. % SuperAdmins now have cascading access to admin role.', v_superadmin_count;
END $$;

-- =====================================================
-- VERIFICATION QUERIES (Run these to confirm fix)
-- =====================================================

-- Test 1: Check function exists with SuperAdmin bypass
-- SELECT prosrc FROM pg_proc WHERE proname = 'has_role' AND pronamespace = 'public'::regnamespace;

-- Test 2: Verify SuperAdmin has admin role (cascading)
-- Replace '<superadmin-email>' with actual SuperAdmin email
-- SELECT public.has_role(
--   (SELECT id FROM auth.users WHERE email = '<superadmin-email>'),
--   'admin'
-- );
-- Expected: true

-- Test 3: Verify SuperAdmin has supplier role (cascading)
-- SELECT public.has_role(
--   (SELECT id FROM auth.users WHERE email = '<superadmin-email>'),
--   'supplier'
-- );
-- Expected: true

-- Test 4: Verify RLS policies work
-- SELECT * FROM pg_policies WHERE tablename = 'suppliers';
-- Check that policies use has_role() function

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

-- If you see "SuperAdmin role bypass restored" notice above,
-- the fix was successful! Test by:
-- 1. Login as SuperAdmin
-- 2. Navigate to /tedarikci
-- 3. Should see supplier dashboard without errors
