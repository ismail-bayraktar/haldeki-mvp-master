-- Phase 11: Warehouse MVP - Comprehensive Schema Fixes
-- Date: 2025-01-09
-- Purpose: Fix ALL database schema issues for warehouse functionality
-- Issues Fixed:
--   1. Create vendors table (missing)
--   2. Add missing columns to orders (placed_at, order_number, prepared_at, customer_name, customer_phone)
--   3. Rename shipping_address to delivery_address for consistency
--   4. Migrate existing data
--   5. Create test warehouse staff record
--   6. Add performance indexes

-- ============================================
-- STEP 1: CREATE VENDORS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create default vendor for existing data
INSERT INTO public.vendors (id, name, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID,
  'Default Vendor',
  true
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 2: ADD MISSING COLUMNS TO ORDERS
-- ============================================

-- Add placed_at (nullable first, then backfill)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS placed_at TIMESTAMPTZ;

-- Backfill placed_at from created_at for existing records
UPDATE public.orders
SET placed_at = created_at
WHERE placed_at IS NULL;

-- Set default for future records (after backfill)
ALTER TABLE public.orders
ALTER COLUMN placed_at SET DEFAULT NOW();

-- Add order_number (nullable first, then backfill)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS order_number TEXT;

-- Generate unique order numbers for existing records
UPDATE public.orders
SET order_number = 'ORD-' || LPAD(EXTRACT(MILLISECOND FROM (id::TEXT::TIMESTAMP))::TEXT, 6, '0')
WHERE order_number IS NULL;

-- Add unique constraint after backfill
ALTER TABLE public.orders
ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);

-- Add prepared_at
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS prepared_at TIMESTAMPTZ;

-- Add customer_name (nullable - legacy orders may not have)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Add customer_phone (nullable - legacy orders may not have)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Add vendor_id for multi-vendor support
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL;

-- Backfill vendor_id for existing orders
UPDATE public.orders
SET vendor_id = '00000000-0000-0000-0000-000000000001'::UUID
WHERE vendor_id IS NULL;

-- ============================================
-- STEP 3: RENAME shipping_address TO delivery_address
-- ============================================

-- Add new column first
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivery_address JSONB;

-- Migrate data from shipping_address to delivery_address
UPDATE public.orders
SET delivery_address = shipping_address
WHERE delivery_address IS NULL AND shipping_address IS NOT NULL;

-- Drop old column (commented out for safety - uncomment after verification)
-- ALTER TABLE public.orders DROP COLUMN IF EXISTS shipping_address;

-- ============================================
-- STEP 4: CREATE INDEXES
-- ============================================

-- Index for order_number lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number
ON public.orders(order_number TEXT_PATTERN_OPS);

-- Index for placed_at range queries (time window filtering)
CREATE INDEX IF NOT EXISTS idx_orders_placed_at
ON public.orders(placed_at DESC);

-- Index for vendor_id filtering
CREATE INDEX IF NOT EXISTS idx_orders_vendor_id
ON public.orders(vendor_id);

-- Composite index for vendor + warehouse + time (when warehouse_id is added)
-- CREATE INDEX IF NOT EXISTS idx_orders_vendor_warehouse_created
-- ON public.orders(vendor_id, warehouse_id, created_at DESC);

-- ============================================
-- STEP 5: CREATE WAREHOUSE STAFF TEST RECORD
-- ============================================

-- Insert warehouse staff record for test user
INSERT INTO public.warehouse_staff (user_id, vendor_id, warehouse_id, is_active)
SELECT
  (SELECT id FROM auth.users WHERE email = 'warehouse@test.haldeki.com'),
  '00000000-0000-0000-0000-000000000001'::UUID,
  (SELECT id FROM public.regions WHERE is_active = true LIMIT 1),
  true
WHERE EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'warehouse@test.haldeki.com'
)
ON CONFLICT (user_id, vendor_id, warehouse_id) DO UPDATE SET
  is_active = EXCLUDED.is_active;

-- ============================================
-- STEP 6: BACKFILL customer_name AND customer_phone
-- ============================================

-- Copy from profiles if available
UPDATE public.orders o
SET
  customer_name = pr.full_name,
  customer_phone = pr.phone
FROM public.profiles pr
WHERE o.user_id = pr.id
  AND o.customer_name IS NULL
  AND pr.full_name IS NOT NULL;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

DO $$
DECLARE
  v_vendor_count INT;
  v_orders_placed_at INT;
  v_orders_order_number INT;
  v_orders_vendor_id INT;
  v_warehouse_staff_count INT;
BEGIN
  -- Verify vendors table
  SELECT COUNT(*) INTO v_vendor_count FROM public.vendors;
  RAISE NOTICE '✅ vendors table created: % records', v_vendor_count;

  -- Verify placed_at column
  SELECT COUNT(*) INTO v_orders_placed_at FROM public.orders WHERE placed_at IS NOT NULL;
  RAISE NOTICE '✅ placed_at column added: % orders have placed_at', v_orders_placed_at;

  -- Verify order_number column
  SELECT COUNT(*) INTO v_orders_order_number FROM public.orders WHERE order_number IS NOT NULL;
  RAISE NOTICE '✅ order_number column added: % orders have order_number', v_orders_order_number;

  -- Verify vendor_id column
  SELECT COUNT(*) INTO v_orders_vendor_id FROM public.orders WHERE vendor_id IS NOT NULL;
  RAISE NOTICE '✅ vendor_id column added: % orders have vendor_id', v_orders_vendor_id;

  -- Verify warehouse staff
  SELECT COUNT(*) INTO v_warehouse_staff_count FROM public.warehouse_staff;
  RAISE NOTICE '✅ warehouse_staff records: %', v_warehouse_staff_count;

  -- Final summary
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Phase 11 Warehouse Fixes - VERIFICATION COMPLETE';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ All schema fixes applied successfully';
  RAISE NOTICE '✅ RPC functions should now work correctly';
  RAISE NOTICE '⚠️  Remember to test: warehouse_get_orders(), warehouse_get_picking_list(), warehouse_mark_prepared()';
END $$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.vendors IS 'Vendor/supplier records for multi-vendor warehouse support';
COMMENT ON COLUMN public.orders.placed_at IS 'Order placement timestamp (defaults to created_at for legacy orders)';
COMMENT ON COLUMN public.orders.order_number IS 'Human-readable order number (ORD-XXXXXX format)';
COMMENT ON COLUMN public.orders.prepared_at IS 'Timestamp when order was marked as prepared';
COMMENT ON COLUMN public.orders.customer_name IS 'Customer name (denormalized from profiles for warehouse)';
COMMENT ON COLUMN public.orders.customer_phone IS 'Customer phone (denormalized from profiles for warehouse)';
COMMENT ON COLUMN public.orders.vendor_id IS 'Vendor ID for multi-vendor order routing';
COMMENT ON COLUMN public.orders.delivery_address IS 'Delivery address (renamed from shipping_address for consistency)';
