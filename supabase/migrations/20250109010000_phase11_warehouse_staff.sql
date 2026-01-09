-- Phase 11: Warehouse MVP - Warehouse Staff Table (Vendor-Scoped)
-- Date: 2025-01-09
-- Purpose: Create warehouse_staff table with multi-vendor support
-- SECURITY: vendor_id is part of PK to prevent cross-tenant leakage

-- ============================================
-- TABLE: warehouse_staff
-- ============================================

CREATE TABLE IF NOT EXISTS public.warehouse_staff (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL,  -- CRITICAL: Tenant scoping (P0 security)
  warehouse_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, vendor_id, warehouse_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_warehouse_staff_user ON public.warehouse_staff(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_warehouse_staff_vendor_warehouse ON public.warehouse_staff(vendor_id, warehouse_id);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.warehouse_staff ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage warehouse staff" ON public.warehouse_staff;
DROP POLICY IF EXISTS "Warehouse staff can view own record" ON public.warehouse_staff;

-- Admins can manage all warehouse staff
CREATE POLICY "Admins can manage warehouse staff"
ON public.warehouse_staff FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'superadmin')
  )
);

-- Warehouse staff can view their own record
CREATE POLICY "Warehouse staff can view own record"
ON public.warehouse_staff FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.warehouse_staff IS 'Warehouse staff with vendor-scoped access (multi-vendor safe)';
COMMENT ON COLUMN public.warehouse_staff.user_id IS 'Reference to auth.users';
COMMENT ON COLUMN public.warehouse_staff.vendor_id IS 'CRITICAL: Vendor scoping - prevents cross-tenant leakage';
COMMENT ON COLUMN public.warehouse_staff.warehouse_id IS 'Reference to regions table (physical warehouse location)';
COMMENT ON COLUMN public.warehouse_staff.is_active IS 'Active status - inactive staff cannot access warehouse functions';
COMMENT ON COLUMN public.warehouse_staff.created_at IS 'Record creation timestamp';
