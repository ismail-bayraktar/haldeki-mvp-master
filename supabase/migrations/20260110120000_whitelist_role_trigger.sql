-- ============================================================================
-- Auto-assign 'user' role on whitelist approval
-- Date: 2026-01-08
-- Purpose: Automatically grant 'user' role when whitelist application approved
-- ============================================================================

-- Function to assign role
CREATE OR REPLACE FUNCTION public.assign_user_role_on_approval()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp  -- CRITICAL: Bypass RLS policies
AS $$
BEGIN
  -- Only when status changes to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' AND OLD.status IS NOT NULL THEN

    -- Check if user exists with this phone number
    -- Note: We match by phone because that's the link between applications and users
    INSERT INTO public.user_roles (user_id, role)
    SELECT
      u.id,
      'user'::text
    FROM public.users u
    WHERE u.phone = NEW.phone
    AND NOT EXISTS (
      -- Avoid duplicate if already has user role
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = u.id
      AND ur.role = 'user'
    )
    ON CONFLICT (user_id, role) DO NOTHING;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS on_whitelist_approved ON public.whitelist_applications;
CREATE TRIGGER on_whitelist_approved
  AFTER UPDATE ON public.whitelist_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_user_role_on_approval();

-- Add comment for documentation
COMMENT ON FUNCTION public.assign_user_role_on_approval() IS
'Automatically assigns "user" role to users when their whitelist application is approved';
