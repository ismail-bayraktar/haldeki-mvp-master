-- Fix Whitelist RLS Policy - Login Blocking Bug
-- Date: 2026-01-09
-- Issue: whitelist_applications table has RLS enabled but no SELECT policy
-- Impact: Users cannot login because checkWhitelistStatus() query is blocked
-- Severity: CRITICAL - All user logins are failing silently

-- Enable RLS (if not already enabled)
ALTER TABLE IF EXISTS public.whitelist_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (idempotent)
DROP POLICY IF EXISTS "Users can view whitelist by phone" ON public.whitelist_applications;
DROP POLICY IF EXISTS "Authenticated can view whitelist" ON public.whitelist_applications;

-- Create policy to allow authenticated users to query whitelist by phone
-- This is needed for login flow to check whitelist status
CREATE POLICY "Authenticated can view whitelist by phone"
ON public.whitelist_applications
FOR SELECT
TO authenticated
USING (true);  -- Allow all authenticated users to check whitelist status

-- Verification queries
-- Run these after applying the migration to verify the fix:

-- 1. Check that RLS is enabled
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'whitelist_applications';

-- 2. Check that policy exists
-- SELECT policyname, cmd, permissive, roles FROM pg_policies WHERE tablename = 'whitelist_applications';
