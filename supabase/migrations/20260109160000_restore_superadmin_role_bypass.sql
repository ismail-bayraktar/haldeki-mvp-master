-- Restore SuperAdmin cascading permissions in has_role function
-- Fixes: "Tedarikçi kaydı bulunamadı" error for SuperAdmins accessing supplier dashboard
-- Date: 2026-01-09

-- Drop existing simplified has_role function
DROP FUNCTION IF EXISTS public.has_role(_user_id uuid, _role public.app_role);

-- Recreate has_role with SuperAdmin cascading permissions
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

-- Add comment for documentation
COMMENT ON FUNCTION public.has_role IS 'Checks if user has role. SuperAdmins have cascading access to all roles except superadmin role itself.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Verify function works correctly
-- Test: SELECT has_role('<superadmin-user-id>', 'admin'); should return true
-- Test: SELECT has_role('<superadmin-user-id>', 'supplier'); should return true
-- Test: SELECT has_role('<superadmin-user-id>', 'superadmin'); should return true
