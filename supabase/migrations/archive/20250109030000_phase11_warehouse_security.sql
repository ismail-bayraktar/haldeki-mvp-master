-- Phase 11: Warehouse MVP - Block Direct Access to Orders Table
-- Date: 2025-01-09
-- Purpose: CRITICAL - Block warehouse_manager from SELECT on orders table
-- SECURITY: This prevents JSON price leaks via orders.items
-- NOTE: warehouse_staff can ONLY use RPC functions, not direct table access

-- ============================================
-- DROP EXISTING WAREHOUSE POLICIES ON ORDERS
-- ============================================

-- Drop any existing policies that might allow warehouse access
DROP POLICY IF EXISTS "Warehouse can view orders" ON public.orders;
DROP POLICY IF EXISTS "Warehouse can update orders" ON public.orders;
DROP POLICY IF EXISTS "Warehouse managers can view orders" ON public.orders;
DROP POLICY IF EXISTS "Warehouse managers can update orders" ON public.orders;

-- ============================================
-- NO NEW POLICIES FOR WAREHOUSE ON ORDERS TABLE
-- ============================================

-- CRITICAL: We do NOT create any policies for warehouse_manager/warehouse_staff on orders table
-- They MUST use RPC functions only (warehouse_get_orders, warehouse_mark_prepared)
-- This prevents any possibility of price leakage via orders.items JSON

-- ============================================
-- ENSURE RLS IS ENABLED
-- ============================================

-- Make sure RLS is enabled on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICATION QUERY (DO NOT RUN IN PRODUCTION)
-- ============================================

-- To verify security, run this test:
-- SELECT * FROM public.orders;  -- Should return empty or error for warehouse users

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.orders IS 'Customer orders - warehouse users CANNOT access directly, MUST use RPC functions (P0 security)';
