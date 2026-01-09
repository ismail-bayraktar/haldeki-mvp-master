-- Phase 12: Rollback Script (Emergency Use Only)
-- Date: 2025-01-10
-- Purpose: Rollback multi-supplier schema changes if needed
-- WARNING: This will DELETE all supplier_products data

-- ============================================================================
-- ROLLBACK WARNING
-- ============================================================================
-- This script will:
-- 1. Delete all supplier_products records (CANNOT BE UNDONE)
-- 2. Delete all product_variations records (CANNOT BE UNDONE)
-- 3. Delete all supplier_product_variations records (CANNOT BE UNDONE)
-- 4. Drop views, functions, and triggers
-- 5. Drop the new tables

-- DO NOT RUN THIS SCRIPT WITHOUT:
-- 1. Full database backup
-- 2. Approval from system owner
-- 3. Testing on staging environment first

-- ============================================================================
-- DROP VIEWS
-- ============================================================================

DROP VIEW IF EXISTS public.bugun_halde_comparison CASCADE;
DROP VIEW IF EXISTS public.supplier_catalog_with_variations CASCADE;

-- ============================================================================
-- DROP FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_product_suppliers(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_product_variations(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_product_price_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.search_supplier_products(
  UUID,
  TEXT,
  product_variation_type[],
  NUMERIC,
  NUMERIC
) CASCADE;

-- ============================================================================
-- DROP TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_supplier_products_updated_at ON public.supplier_products;
DROP TRIGGER IF EXISTS trigger_supplier_product_variations_updated_at ON public.supplier_product_variations;

-- ============================================================================
-- DROP TRIGGER FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS public.update_supplier_products_updated_at() CASCADE;

-- ============================================================================
-- DROP POLICIES
-- ============================================================================

-- supplier_products policies
DROP POLICY IF EXISTS "Public can view active supplier products" ON public.supplier_products;
DROP POLICY IF EXISTS "Suppliers can view their own products" ON public.supplier_products;
DROP POLICY IF EXISTS "Suppliers can insert their own products" ON public.supplier_products;
DROP POLICY IF EXISTS "Suppliers can update their own products" ON public.supplier_products;
DROP POLICY IF EXISTS "Suppliers can delete their own products" ON public.supplier_products;
DROP POLICY IF EXISTS "Admins can manage all supplier products" ON public.supplier_products;

-- product_variations policies
DROP POLICY IF EXISTS "Authenticated users can view product variations" ON public.product_variations;
DROP POLICY IF EXISTS "Admins can insert product variations" ON public.product_variations;
DROP POLICY IF EXISTS "Admins can update product variations" ON public.product_variations;
DROP POLICY IF EXISTS "Admins can delete product variations" ON public.product_variations;

-- supplier_product_variations policies
DROP POLICY IF EXISTS "Public can view supplier product variations" ON public.supplier_product_variations;
DROP POLICY IF EXISTS "Suppliers can manage their own product variations" ON public.supplier_product_variations;
DROP POLICY IF EXISTS "Admins can manage all supplier product variations" ON public.supplier_product_variations;

-- ============================================================================
-- DROP INDEXES
-- ============================================================================

-- supplier_products indexes
DROP INDEX IF EXISTS public.idx_supplier_products_supplier_id;
DROP INDEX IF EXISTS public.idx_supplier_products_product_id;
DROP INDEX IF EXISTS public.idx_supplier_products_active;
DROP INDEX IF EXISTS public.idx_supplier_products_featured;
DROP INDEX IF EXISTS public.idx_supplier_products_availability;
DROP INDEX IF EXISTS public.idx_supplier_products_price_change;
DROP INDEX IF EXISTS public.idx_supplier_products_product_price;
DROP INDEX IF EXISTS public.idx_supplier_products_supplier_active_updated;

-- product_variations indexes
DROP INDEX IF EXISTS public.idx_product_variations_product_id;
DROP INDEX IF EXISTS public.idx_product_variations_type;
DROP INDEX IF EXISTS public.idx_product_variations_display_order;

-- supplier_product_variations indexes
DROP INDEX IF EXISTS public.idx_supplier_product_variations_supplier_product;
DROP INDEX IF EXISTS public.idx_supplier_product_variations_variation;

-- ============================================================================
-- DROP TABLES (CAREFUL: DATA LOSS)
-- ============================================================================

-- Drop in correct order due to foreign key constraints
DROP TABLE IF EXISTS public.supplier_product_variations CASCADE;
DROP TABLE IF EXISTS public.supplier_products CASCADE;
DROP TABLE IF EXISTS public.product_variations CASCADE;

-- ============================================================================
-- DROP ENUM TYPE
-- ============================================================================

DROP TYPE IF EXISTS public.product_variation_type CASCADE;

-- ============================================================================
-- ROLLBACK COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== MULTI-SUPPLIER ROLLBACK COMPLETE ===';
  RAISE NOTICE 'All Phase 12 tables, indexes, and functions have been dropped';
  RAISE NOTICE 'WARNING: All supplier_products data has been permanently deleted';
  RAISE NOTICE 'Products table is now in pre-Phase 12 state';
END $$;
