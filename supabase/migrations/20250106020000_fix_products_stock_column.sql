-- Fix Phase 9: Add missing columns to products table
-- Date: 2026-01-06
-- Issue: products table missing 'stock' column referenced by supplier product management

-- Add price column (retail price - was missing from initial schema)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS price NUMERIC;

-- Add stock column (stok miktarı)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 100;

-- Add supplier_id column (if not exists - needed for supplier product management)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add base_price column (supplier's base price - different from regional price)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS base_price NUMERIC;

-- Note: base_price will be set manually by suppliers when creating products

-- Add description column (if not exists)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add product_status column (Phase 9 - product lifecycle management)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS product_status TEXT
DEFAULT 'active'
CHECK (product_status IN ('active', 'inactive', 'out_of_stock'));

-- Add last_modified_by tracking
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add last_modified_at timestamp
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for supplier queries
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON public.products(supplier_id) WHERE supplier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(product_status);

-- Create trigger to update last_modified_at
CREATE OR REPLACE FUNCTION update_product_last_modified_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified_at = NOW();
  NEW.last_modified_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_products_last_modified ON public.products;

CREATE TRIGGER update_products_last_modified
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION update_product_last_modified_at();

-- Add comments
COMMENT ON COLUMN products.stock IS 'Stok miktarı - ürün için mevcut adet';
COMMENT ON COLUMN products.supplier_id IS 'Ürünü ekleyen tedarikçinin kullanıcı ID''si';
COMMENT ON COLUMN products.base_price IS 'Tedarikçinin taban fiyatı (bölge fiyatları farklı olabilir)';
COMMENT ON COLUMN products.product_status IS 'Ürün yaşam döngüsü durumu: active, inactive, out_of_stock';
COMMENT ON COLUMN products.last_modified_by IS 'Son güncelleyen kullanıcı';
COMMENT ON COLUMN products.last_modified_at IS 'Son güncelleme zamanı';
