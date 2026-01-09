-- ============================================================================
-- PASSWORD RESET FIX - Create Admin Function
-- ============================================================================
-- Purpose: Create a secure function to reset passwords via Supabase Auth
-- This function uses the native auth.users update mechanism
-- ============================================================================

-- Create a helper function to trigger password reset email
-- This is the proper way to handle password resets in Supabase

CREATE OR REPLACE FUNCTION auth.send_password_reset_email(email_target text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_result jsonb;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = email_target;

  IF v_user_id IS NULL THEN
    RETURN '{"success": false, "error": "User not found"}'::jsonb;
  END IF;

  -- Trigger password reset email
  -- Note: This sends an email to the user with a reset link
  -- The user must click the link to set a new password
  PERFORM net.http_post(
    url := 'https://' || current_setting('app.project_url') || '/auth/v1/admin/users/' || v_user_id || '/recovery',
    headers := jsonb_build_object(
      'apikey', current_setting('app.service_role_key'),
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('type', 'email')
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Password reset email sent',
    'user_id', v_user_id
  );
END;
$$;

-- ============================================================================
-- INSTRUCTIONS FOR MANUAL PASSWORD RESET
-- ============================================================================
-- Since Supabase doesn't allow direct password manipulation via SQL for
-- security reasons, follow these steps:
--
-- 1. Open Supabase Dashboard
-- 2. Go to Authentication → Users
-- 3. Find each user and click "Reset Password"
-- 4. Set the password to: Test1234!
-- 5. Ensure "Email Confirmed" is checked
--
-- User accounts to reset:
--   - admin@haldeki.com (superadmin)
--   - superadmin@test.haldeki.com (superadmin)
--   - supplier-approved@test.haldeki.com (supplier)
-- ============================================================================

-- Create view to track which users need password reset
CREATE OR REPLACE VIEW public.users_needing_password_reset AS
SELECT
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at,
  u.last_sign_in_at,
  u.updated_at,
  COALESCE(
    jsonb_agg(DISTINCT r.role) FILTER (WHERE r.role IS NOT NULL),
    '[]'::jsonb
  ) as roles
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE u.email IN (
  'admin@haldeki.com',
  'superadmin@test.haldeki.com',
  'supplier-approved@test.haldeki.com'
)
GROUP BY u.id, u.email, u.email_confirmed_at, u.created_at, u.last_sign_in_at, u.updated_at;

-- Grant access to developers (you may need to adjust this)
GRANT SELECT ON public.users_needing_password_reset TO authenticated;
GRANT SELECT ON public.users_needing_password_reset TO anon;

-- Add helpful comment
COMMENT ON VIEW public.users_needing_password_reset IS
'Track test users that need password reset. Check email_confirmed_at is not null.';
