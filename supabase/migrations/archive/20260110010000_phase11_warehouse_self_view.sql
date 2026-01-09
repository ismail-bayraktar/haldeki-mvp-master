-- Phase 11.1: Warehouse Staff Self-View RLS Policy
-- Date: 2026-01-10
-- Description: Allow warehouse staff to view other staff assigned to the same vendor

-- =====================================================================
-- RLS Policy: Warehouse Staff Self-View (Same Vendor)
-- =====================================================================
--
-- Business Rule:
--   Warehouse staff should be able to view other warehouse staff
--   assigned to the same vendor (for coordination purposes)
--
-- Example:
--   Warehouse staff "Ali" works for vendor "Aliaga Tarım"
--   He can see other warehouse staff at "Aliaga Tarım"
--   He CANNOT see staff at "Menemen Tarım" (different vendor)
--
-- =====================================================================

-- Enable RLS on warehouse_staff table (if not already enabled)
ALTER TABLE public.warehouse_staff ENABLE ROW LEVEL SECURITY;

-- Policy: Warehouse staff can view same-vendor staff
CREATE POLICY "Warehouse staff can view same-vendor staff"
ON public.warehouse_staff FOR SELECT
TO authenticated
USING (
  EXISTS (
    -- Check if current user is a warehouse staff member
    SELECT 1
    FROM public.warehouse_staff ws2
    WHERE ws2.user_id = auth.uid()
      -- Allow viewing only same-vendor staff
      AND ws2.vendor_id = warehouse_staff.vendor_id
  )
);

-- =====================================================================
-- Verification & Testing
-- =====================================================================

-- Test 1: Verify policy exists
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'warehouse_staff'
  AND policyname = 'Warehouse staff can view same-vendor staff';

-- Expected result:
-- - policyname: "Warehouse staff can view same-vendor staff"
-- - cmd: SELECT
-- - permissive: t (true)

-- Test 2: Verify warehouse staff can query
-- (Run this as a warehouse staff user)
-- SELECT * FROM public.warehouse_staff;
-- Expected: Returns all staff for same vendor only

-- Test 3: Verify admin can still query all
-- (Run this as an admin user)
-- SELECT * FROM public.warehouse_staff;
-- Expected: Returns all staff (admin policy still applies)

-- =====================================================================
-- Policy Dependencies
-- =====================================================================
--
-- Depends on:
--   - warehouse_staff table (20250109010000_phase11_warehouse_staff.sql)
--   - user_roles table (for admin check)
--   - auth.uid() function (Supabase Auth)
--
-- Conflicts with:
--   - None (complementary to existing policies)
--
-- =====================================================================
-- Migration History
-- =====================================================================
-- 2026-01-10: Initial creation
--            - Added self-view RLS policy for warehouse staff
--            - Enables same-vendor coordination
-- =====================================================================
