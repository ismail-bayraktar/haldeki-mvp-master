-- Phase 10: Excel/CSV Import/Export System for Suppliers
-- Date: 2026-01-07
-- Purpose: Track bulk product imports with audit log and rollback capability

-- ============================================
-- TABLE: product_imports (Import Audit Log)
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  total_rows INTEGER NOT NULL,
  successful_rows INTEGER NOT NULL DEFAULT 0,
  failed_rows INTEGER NOT NULL DEFAULT 0,
  errors JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'rolled_back')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_product_imports_supplier ON public.product_imports(supplier_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_imports_status ON public.product_imports(status);
CREATE INDEX IF NOT EXISTS idx_product_imports_created_at ON public.product_imports(created_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.product_imports ENABLE ROW LEVEL SECURITY;

-- Suppliers can view their own imports
CREATE POLICY "Suppliers can view own imports"
ON public.product_imports FOR SELECT
TO authenticated
USING (
  supplier_id IN (
    SELECT id FROM public.suppliers
    WHERE user_id = auth.uid()
    AND approval_status = 'approved'
  )
);

-- Suppliers can create imports
CREATE POLICY "Suppliers can create imports"
ON public.product_imports FOR INSERT
TO authenticated
WITH CHECK (
  supplier_id IN (
    SELECT id FROM public.suppliers
    WHERE user_id = auth.uid()
    AND approval_status = 'approved'
  )
);

-- Suppliers can update their own imports
CREATE POLICY "Suppliers can update own imports"
ON public.product_imports FOR UPDATE
TO authenticated
USING (
  supplier_id IN (
    SELECT id FROM public.suppliers
    WHERE user_id = auth.uid()
    AND approval_status = 'approved'
  )
);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.product_imports IS 'Tracks bulk product imports from suppliers with audit log and error details';
COMMENT ON COLUMN public.product_imports.supplier_id IS 'Reference to supplier who initiated the import';
COMMENT ON COLUMN public.product_imports.file_name IS 'Name of uploaded file';
COMMENT ON COLUMN public.product_imports.file_size IS 'Size of file in bytes';
COMMENT ON COLUMN public.product_imports.total_rows IS 'Total number of rows in import file';
COMMENT ON COLUMN public.product_imports.successful_rows IS 'Number of successfully imported rows';
COMMENT ON COLUMN public.product_imports.failed_rows IS 'Number of failed rows';
COMMENT ON COLUMN public.product_imports.errors IS 'Array of error objects: [{row, field, error, value}]';
COMMENT ON COLUMN public.product_imports.status IS 'Import status: pending, processing, completed, failed, rolled_back';

-- ============================================
-- SECURITY FIXES: BUSINESS PRICE ISOLATION
-- ============================================

-- Create policy to hide business_price from non-business users
-- First check if region_products table exists and has business_price column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'region_products'
    AND column_name = 'business_price'
  ) THEN
    -- Drop policy if exists
    DROP POLICY IF EXISTS "Hide business price from non-business" ON public.region_products;

    -- Create policy to hide business_price from non-business users
    CREATE POLICY "Hide business price from non-business"
    ON public.region_products FOR SELECT
    TO authenticated
    USING (
      has_role(auth.uid(), 'business')
      OR has_role(auth.uid(), 'admin')
      OR business_price IS NULL
    );

    COMMENT ON POLICY "Hide business price from non-business" ON public.region_products IS 'Only business customers and admins can see business_price';
  END IF;
END $$;
