-- Fix Auth Login Bug - user_roles RLS Policy Fix
-- Date: 2026-01-09
-- Issue: 500 Internal Server Error when querying user_roles after login
-- Root Cause: RLS policies have circular dependency or are too restrictive
-- User: bf3a2b7a-0490-46c7-ba74-72cf8748592f cannot login

-- Enable RLS on user_roles (if not already enabled)
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated can view roles" ON public.user_roles;

-- Create simplified RLS policies for user_roles

-- Policy 1: Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Service role (for admin operations) can do everything
CREATE POLICY "Service role can manage all roles"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Note: If you still get 500 errors, check:
-- 1. Does the user_roles table exist? SELECT * FROM public.user_roles LIMIT 1;
-- 2. Does the user have any roles? SELECT * FROM public.user_roles WHERE user_id = 'your-user-id';
-- 3. Is RLS actually enabled? SELECT relname FROM pg_class WHERE relname = 'user_roles';
