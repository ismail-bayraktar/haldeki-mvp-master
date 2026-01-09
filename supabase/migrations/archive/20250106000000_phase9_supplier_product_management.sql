-- Phase 9: Supplier Product Management
-- Enables suppliers to directly manage their products with mobile-first interface

-- ============================================================================
-- PRODUCT STATUS COLUMN
-- ============================================================================

-- Add product_status column for better product lifecycle management
ALTER TABLE products
ADD COLUMN IF NOT EXISTS product_status TEXT
DEFAULT 'active'
CHECK (product_status IN ('active', 'inactive', 'out_of_stock'));

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_products_product_status ON products(product_status)
WHERE product_status = 'active';

-- ============================================================================
-- MODIFICATION TRACKING
-- ============================================================================

-- Add tracking fields for product modifications
ALTER TABLE products
ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ DEFAULT NOW();

-- Add index for finding recently modified products
CREATE INDEX IF NOT EXISTS idx_products_last_modified ON products(last_modified_at DESC);

-- ============================================================================
-- SUPPLIER PRODUCT PERMISSIONS
-- ============================================================================

-- Grant suppliers permission to manage products
GRANT INSERT, UPDATE, DELETE ON products TO authenticated;
-- Grant sequence usage if it exists (PostgreSQL 15+ doesn't require explicit sequence grants)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'products_id_seq') THEN
    GRANT USAGE, SELECT ON SEQUENCE products_id_seq TO authenticated;
  END IF;
END $$;

-- ============================================================================
-- RLS POLICIES FOR SUPPLIER PRODUCT MANAGEMENT
-- ============================================================================

-- Drop existing supplier policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Suppliers can view their products" ON products;
DROP POLICY IF EXISTS "Suppliers can insert their products" ON products;
DROP POLICY IF EXISTS "Suppliers can update their products" ON products;
DROP POLICY IF EXISTS "Suppliers can delete their products" ON products;

-- Policy: Suppliers can view all products (for market visibility)
CREATE POLICY "Suppliers can view products"
ON products
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'supplier'
  )
  AND EXISTS (
    SELECT 1 FROM suppliers
    WHERE user_id = auth.uid()
    AND approval_status = 'approved'
  )
);

-- Policy: Suppliers can insert their own products
CREATE POLICY "Suppliers can insert their products"
ON products
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'supplier'
  )
  AND EXISTS (
    SELECT 1 FROM suppliers
    WHERE user_id = auth.uid()
    AND approval_status = 'approved'
  )
  AND supplier_id = auth.uid()
);

-- Policy: Suppliers can update their own products
CREATE POLICY "Suppliers can update their products"
ON products
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'supplier'
  )
  AND EXISTS (
    SELECT 1 FROM suppliers
    WHERE user_id = auth.uid()
    AND approval_status = 'approved'
  )
  AND supplier_id = auth.uid()
)
WITH CHECK (
  supplier_id = auth.uid()
  AND last_modified_by = auth.uid()
  AND last_modified_at = NOW()
);

-- Policy: Suppliers can delete their own products
CREATE POLICY "Suppliers can delete their products"
ON products
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'supplier'
  )
  AND EXISTS (
    SELECT 1 FROM suppliers
    WHERE user_id = auth.uid()
    AND approval_status = 'approved'
  )
  AND supplier_id = auth.uid()
);

-- ============================================================================
-- PRODUCT IMAGES STORAGE BUCKET
-- ============================================================================

-- Create product-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Suppliers can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Suppliers can delete their product images" ON storage.objects;

-- Policy: Suppliers can upload images to their own folder
CREATE POLICY "Suppliers can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'supplier'
  )
  AND EXISTS (
    SELECT 1 FROM suppliers
    WHERE user_id = auth.uid()
    AND approval_status = 'approved'
  )
);

-- Policy: Public can view all product images (for product display)
CREATE POLICY "Public can view product images"
ON storage.objects
FOR SELECT
TO public, authenticated
USING (bucket_id = 'product-images');

-- Policy: Suppliers can delete their own images
CREATE POLICY "Suppliers can delete their product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- HELPER FUNCTION: Get supplier folder path
-- ============================================================================

-- Helper function to construct folder path for supplier images
CREATE OR REPLACE FUNCTION get_supplier_image_path(supplier_id UUID, filename TEXT)
RETURNS TEXT AS $$
  SELECT supplier_id::text || '/' || filename;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- TRIGGER: Update last_modified_at on product change
-- ============================================================================

-- Create trigger function
CREATE OR REPLACE FUNCTION update_last_modified_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified_at = NOW();
  NEW.last_modified_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and create
DROP TRIGGER IF EXISTS update_product_last_modified ON products;

-- Apply trigger to products table
CREATE TRIGGER update_product_last_modified
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_last_modified_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN products.product_status IS 'Product lifecycle status: active, inactive, out_of_stock';
COMMENT ON COLUMN products.last_modified_by IS 'User who last modified the product';
COMMENT ON COLUMN products.last_modified_at IS 'Timestamp of last modification';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Composite index for supplier product queries
CREATE INDEX IF NOT EXISTS idx_products_supplier_status ON products(supplier_id, product_status)
WHERE supplier_id IS NOT NULL;

-- Index for supplier's active products
CREATE INDEX IF NOT EXISTS idx_products_supplier_active ON products(supplier_id, last_modified_at DESC)
WHERE product_status = 'active' AND supplier_id IS NOT NULL;
