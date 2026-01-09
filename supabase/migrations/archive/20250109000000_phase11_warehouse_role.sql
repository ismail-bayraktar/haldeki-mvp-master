-- Phase 11: Warehouse MVP - Role Extension
-- Date: 2025-01-09
-- Purpose: Add warehouse_manager role to user_roles constraint

-- ============================================
-- DROP EXISTING CONSTRAINT
-- ============================================

-- Drop the old constraint (if exists)
ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_role_check;

-- ============================================
-- ADD NEW CONSTRAINT WITH warehouse_manager
-- ============================================

-- Re-create constraint with warehouse_manager included
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_role_check
CHECK (role IN ('user', 'admin', 'superadmin', 'dealer', 'supplier', 'business', 'warehouse_manager'));

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON CONSTRAINT user_roles_role_check ON public.user_roles IS
'Allowed roles: user, admin, superadmin, dealer, supplier, business, warehouse_manager';
