-- Phase 11: Warehouse MVP - Performance Indexes
-- Date: 2025-01-09
-- Purpose: Add indexes for warehouse queries (picking list, orders by time window)

-- ============================================
-- PARTIAL INDEX: orders_created_at_status
-- Purpose: Fast query for orders by time window and status
-- ============================================

CREATE INDEX IF NOT EXISTS idx_orders_created_at_status
ON public.orders(created_at DESC)
WHERE status IN ('confirmed', 'preparing', 'prepared');

-- ============================================
-- PARTIAL INDEX: orders_region_created_at
-- Purpose: Fast query for orders by region and time (for warehouse scoping)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_orders_region_created_at
ON public.orders(region_id, created_at DESC)
WHERE status IN ('confirmed', 'preparing', 'prepared');

-- ============================================
-- INDEX: orders_region_status
-- Purpose: Fast query for dealer/warehouse filtering by region and status
-- ============================================

CREATE INDEX IF NOT EXISTS idx_orders_region_status
ON public.orders(region_id, status)
WHERE status IN ('confirmed', 'preparing', 'prepared');

-- ============================================
-- FUTURE INDEXES (when columns are added)
-- ============================================

/*
-- When vendor_id column is added to orders table:
CREATE INDEX IF NOT EXISTS idx_orders_vendor_warehouse_created
ON public.orders(vendor_id, warehouse_id, created_at DESC)
WHERE status IN ('confirmed', 'preparing', 'prepared');

-- When prepared_at column exists:
CREATE INDEX IF NOT EXISTS idx_orders_prepared_at
ON public.orders(prepared_at DESC)
WHERE status = 'prepared';
*/

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON INDEX idx_orders_created_at_status IS
'Partial index for time window queries (confirmed/preparing/prepared orders only)';

COMMENT ON INDEX idx_orders_region_created_at IS
'Partial index for warehouse region queries with time ordering';

COMMENT ON INDEX idx_orders_region_status IS
'Index for dealer/warehouse filtering by region and status';

-- ============================================
-- ANALYZE TABLES
-- ============================================

-- Update statistics for query optimizer
ANALYZE public.orders;
ANALYZE public.products;
ANALYZE public.regions;
