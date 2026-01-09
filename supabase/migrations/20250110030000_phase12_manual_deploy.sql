-- Phase 12: Manual Deployment Script
-- Date: 2025-01-10
-- Purpose: Force deploy Phase 12 schema objects (bypasses migration tracking)
-- Usage: Run this directly on the database to create all Phase 12 objects
-- Safety: Uses CREATE IF NOT EXISTS / CREATE OR REPLACE patterns

-- ============================================================================
-- VARIATION TYPES ENUM
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_variation_type') THEN
    CREATE TYPE product_variation_type AS ENUM (
      'size',
      'type',
      'scent',
      'packaging',
      'material',
      'flavor',
      'other'
    );
  END IF;
END $$;

-- ============================================================================
-- SUPPLIER PRODUCTS JUNCTION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.supplier_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,

  price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
  previous_price NUMERIC(10, 2) CHECK (previous_price > 0),
  price_change public.price_change DEFAULT 'stable',

  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  availability public.availability_status DEFAULT 'plenty',

  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,

  quality public.quality_grade DEFAULT 'standart',
  origin TEXT DEFAULT 'Türkiye',

  supplier_sku TEXT,

  min_order_quantity INTEGER DEFAULT 1 CHECK (min_order_quantity > 0),
  delivery_days INTEGER DEFAULT 1 CHECK (delivery_days > 0),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_price_update TIMESTAMPTZ,

  CONSTRAINT supplier_products_unique UNIQUE (supplier_id, product_id)
);

-- ============================================================================
-- PRODUCT VARIATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.product_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,

  variation_type product_variation_type NOT NULL,
  variation_value TEXT NOT NULL,

  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT product_variations_unique UNIQUE (product_id, variation_type, variation_value)
);

-- ============================================================================
-- SUPPLIER PRODUCT VARIATIONS (JUNCTION)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.supplier_product_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_product_id UUID NOT NULL REFERENCES public.supplier_products(id) ON DELETE CASCADE,
  variation_id UUID NOT NULL REFERENCES public.product_variations(id) ON DELETE CASCADE,

  supplier_variation_sku TEXT,
  price_adjustment NUMERIC(10, 2) DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT supplier_product_variations_unique UNIQUE (supplier_product_id, variation_id)
);

-- ============================================================================
-- INDEXES (Performance Optimization)
-- ============================================================================

-- supplier_products indexes
CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier_id
  ON public.supplier_products(supplier_id);

CREATE INDEX IF NOT EXISTS idx_supplier_products_product_id
  ON public.supplier_products(product_id);

CREATE INDEX IF NOT EXISTS idx_supplier_products_active
  ON public.supplier_products(supplier_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_supplier_products_featured
  ON public.supplier_products(is_featured) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_supplier_products_availability
  ON public.supplier_products(availability);

CREATE INDEX IF NOT EXISTS idx_supplier_products_price_change
  ON public.supplier_products(price_change) WHERE price_change != 'stable';

CREATE INDEX IF NOT EXISTS idx_supplier_products_product_price
  ON public.supplier_products(product_id, price) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier_active_updated
  ON public.supplier_products(supplier_id, is_active, updated_at DESC) WHERE is_active = true;

-- product_variations indexes
CREATE INDEX IF NOT EXISTS idx_product_variations_product_id
  ON public.product_variations(product_id);

CREATE INDEX IF NOT EXISTS idx_product_variations_type
  ON public.product_variations(variation_type);

CREATE INDEX IF NOT EXISTS idx_product_variations_display_order
  ON public.product_variations(product_id, display_order);

-- supplier_product_variations indexes
CREATE INDEX IF NOT EXISTS idx_supplier_product_variations_supplier_product
  ON public.supplier_product_variations(supplier_product_id);

CREATE INDEX IF NOT EXISTS idx_supplier_product_variations_variation
  ON public.supplier_product_variations(variation_id);

-- ============================================================================
-- FUNCTIONS (Business Logic)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_product_suppliers(p_product_id UUID)
RETURNS TABLE (
  supplier_id UUID,
  supplier_name TEXT,
  price NUMERIC,
  previous_price NUMERIC,
  price_change public.price_change,
  availability public.availability_status,
  stock_quantity INTEGER,
  quality public.quality_grade,
  delivery_days INTEGER,
  is_featured BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.supplier_id,
    s.name,
    sp.price,
    sp.previous_price,
    sp.price_change,
    sp.availability,
    sp.stock_quantity,
    sp.quality,
    sp.delivery_days,
    sp.is_featured
  FROM public.supplier_products sp
  INNER JOIN public.suppliers s ON s.id = sp.supplier_id
  WHERE sp.product_id = p_product_id
    AND sp.is_active = true
    AND s.is_active = true
  ORDER BY sp.price ASC, sp.is_featured DESC, sp.delivery_days ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_product_variations(p_product_id UUID)
RETURNS TABLE (
  variation_type product_variation_type,
  variation_value TEXT,
  display_order INTEGER,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pv.variation_type,
    pv.variation_value,
    pv.display_order,
    pv.metadata
  FROM public.product_variations pv
  WHERE pv.product_id = p_product_id
  ORDER BY pv.variation_type, pv.display_order, pv.variation_value;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_product_price_stats(p_product_id UUID)
RETURNS TABLE (
  min_price NUMERIC,
  max_price NUMERIC,
  avg_price NUMERIC,
  supplier_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    MIN(sp.price) as min_price,
    MAX(sp.price) as max_price,
    AVG(sp.price) as avg_price,
    COUNT(*) as supplier_count
  FROM public.supplier_products sp
  INNER JOIN public.suppliers s ON s.id = sp.supplier_id
  WHERE sp.product_id = p_product_id
    AND sp.is_active = true
    AND s.is_active = true;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION search_supplier_products(
  p_supplier_id UUID,
  p_search_text TEXT DEFAULT NULL,
  p_variation_types product_variation_type[] DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  supplier_price NUMERIC,
  availability public.availability_status,
  variations JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.id as product_id,
    p.name as product_name,
    sp.price as supplier_price,
    sp.availability,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'type', pv.variation_type,
        'value', pv.variation_value
      ))
      FROM public.supplier_product_variations spv
      INNER JOIN public.product_variations pv ON pv.id = spv.variation_id
      WHERE spv.supplier_product_id = sp.id
    ) as variations
  FROM public.supplier_products sp
  INNER JOIN public.products p ON p.id = sp.product_id
  LEFT JOIN public.supplier_product_variations spv ON spv.supplier_product_id = sp.id
  LEFT JOIN public.product_variations pv ON pv.id = spv.variation_id
  WHERE sp.supplier_id = p_supplier_id
    AND sp.is_active = true
    AND (p_search_text IS NULL OR p.name ILIKE '%' || p_search_text || '%')
    AND (p_variation_types IS NULL OR pv.variation_type = ANY(p_variation_types))
    AND (p_min_price IS NULL OR sp.price >= p_min_price)
    AND (p_max_price IS NULL OR sp.price <= p_max_price)
  ORDER BY sp.price ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS (Data Integrity)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_supplier_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();

  IF OLD.price IS DISTINCT FROM NEW.price THEN
    NEW.last_price_update = NOW();

    IF NEW.price > OLD.price THEN
      NEW.price_change = 'increased';
    ELSIF NEW.price < OLD.price THEN
      NEW.price_change = 'decreased';
    ELSE
      NEW.price_change = 'stable';
    END IF;

    NEW.previous_price = OLD.price;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_supplier_products_updated_at
  ON public.supplier_products;

CREATE TRIGGER trigger_supplier_products_updated_at
  BEFORE UPDATE ON public.supplier_products
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_products_updated_at();

DROP TRIGGER IF EXISTS trigger_supplier_product_variations_updated_at
  ON public.supplier_product_variations;

CREATE TRIGGER trigger_supplier_product_variations_updated_at
  BEFORE UPDATE ON public.supplier_product_variations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- RLS POLICIES (Security)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_product_variations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view active supplier products" ON public.supplier_products;
DROP POLICY IF EXISTS "Suppliers can view their own products" ON public.supplier_products;
DROP POLICY IF EXISTS "Suppliers can insert their own products" ON public.supplier_products;
DROP POLICY IF EXISTS "Suppliers can update their own products" ON public.supplier_products;
DROP POLICY IF EXISTS "Suppliers can delete their own products" ON public.supplier_products;
DROP POLICY IF EXISTS "Admins can manage all supplier products" ON public.supplier_products;

DROP POLICY IF EXISTS "Authenticated users can view product variations" ON public.product_variations;
DROP POLICY IF EXISTS "Admins can insert product variations" ON public.product_variations;
DROP POLICY IF EXISTS "Admins can update product variations" ON public.product_variations;
DROP POLICY IF EXISTS "Admins can delete product variations" ON public.product_variations;

DROP POLICY IF EXISTS "Public can view supplier product variations" ON public.supplier_product_variations;
DROP POLICY IF EXISTS "Suppliers can manage their own product variations" ON public.supplier_product_variations;
DROP POLICY IF EXISTS "Admins can manage all supplier product variations" ON public.supplier_product_variations;

-- supplier_products policies
CREATE POLICY "Public can view active supplier products"
ON public.supplier_products
FOR SELECT
TO public, authenticated
USING (is_active = true);

CREATE POLICY "Suppliers can view their own products"
ON public.supplier_products
FOR SELECT
TO authenticated
USING (
  supplier_id IN (
    SELECT id FROM public.suppliers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Suppliers can insert their own products"
ON public.supplier_products
FOR INSERT
TO authenticated
WITH CHECK (
  supplier_id IN (
    SELECT id FROM public.suppliers
    WHERE user_id = auth.uid()
    AND approval_status = 'approved'
  )
);

CREATE POLICY "Suppliers can update their own products"
ON public.supplier_products
FOR UPDATE
TO authenticated
USING (
  supplier_id IN (
    SELECT id FROM public.suppliers WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  supplier_id IN (
    SELECT id FROM public.suppliers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Suppliers can delete their own products"
ON public.supplier_products
FOR DELETE
TO authenticated
USING (
  supplier_id IN (
    SELECT id FROM public.suppliers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all supplier products"
ON public.supplier_products
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
  )
);

-- product_variations policies
CREATE POLICY "Authenticated users can view product variations"
ON public.product_variations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert product variations"
ON public.product_variations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
  )
);

CREATE POLICY "Admins can update product variations"
ON public.product_variations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
  )
);

CREATE POLICY "Admins can delete product variations"
ON public.product_variations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
  )
);

-- supplier_product_variations policies
CREATE POLICY "Public can view supplier product variations"
ON public.supplier_product_variations
FOR SELECT
TO public, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.supplier_products sp
    WHERE sp.id = supplier_product_id
    AND sp.is_active = true
  )
);

CREATE POLICY "Suppliers can manage their own product variations"
ON public.supplier_product_variations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.supplier_products sp
    INNER JOIN public.suppliers s ON s.id = sp.supplier_id
    WHERE sp.id = supplier_product_id
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all supplier product variations"
ON public.supplier_product_variations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
  )
);

-- ============================================================================
-- VIEWS (For "Bugün Halde" Comparison)
-- ============================================================================

CREATE OR REPLACE VIEW bugun_halde_comparison AS
SELECT
  p.id as product_id,
  p.name as product_name,
  p.category,
  p.unit,
  p.images[1] as image_url,
  s.id as supplier_id,
  s.name as supplier_name,
  sp.price,
  sp.previous_price,
  sp.price_change,
  sp.availability,
  sp.stock_quantity,
  sp.quality,
  sp.delivery_days,
  sp.is_featured,
  stats.min_price as market_min_price,
  stats.max_price as market_max_price,
  stats.avg_price as market_avg_price,
  stats.supplier_count as total_suppliers,
  CASE
    WHEN sp.price = stats.min_price THEN true
    ELSE false
  END as is_lowest_price
FROM public.products p
INNER JOIN public.supplier_products sp ON sp.product_id = p.id
INNER JOIN public.suppliers s ON s.id = sp.supplier_id
INNER JOIN LATERAL (
  SELECT
    MIN(spi.price) as min_price,
    MAX(spi.price) as max_price,
    AVG(spi.price) as avg_price,
    COUNT(*) as supplier_count
  FROM public.supplier_products spi
  WHERE spi.product_id = p.id
    AND spi.is_active = true
) stats ON true
WHERE sp.is_active = true
  AND s.is_active = true
  AND (p.product_status = 'active' OR p.product_status IS NULL)
ORDER BY p.name, sp.price;

CREATE OR REPLACE VIEW supplier_catalog_with_variations AS
SELECT
  s.id as supplier_id,
  s.name as supplier_name,
  p.id as product_id,
  p.name as product_name,
  p.category,
  p.unit,
  sp.price,
  sp.availability,
  sp.stock_quantity,
  sp.is_featured,
  (
    SELECT jsonb_agg(jsonb_build_object(
      'type', pv.variation_type,
      'value', pv.variation_value,
      'metadata', pv.metadata
    ) ORDER BY pv.display_order)
    FROM public.supplier_product_variations spv
    INNER JOIN public.product_variations pv ON pv.id = spv.variation_id
    WHERE spv.supplier_product_id = sp.id
  ) as variations
FROM public.suppliers s
INNER JOIN public.supplier_products sp ON sp.supplier_id = s.id
INNER JOIN public.products p ON p.id = sp.product_id
WHERE sp.is_active = true
  AND s.is_active = true
ORDER BY s.name, p.name;

-- ============================================================================
-- GRANTS (Permissions)
-- ============================================================================

GRANT USAGE ON TYPE product_variation_type TO authenticated;

GRANT SELECT ON bugun_halde_comparison TO public, authenticated;
GRANT SELECT ON supplier_catalog_with_variations TO authenticated;

GRANT EXECUTE ON FUNCTION get_product_suppliers TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_variations TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_price_stats TO authenticated;
GRANT EXECUTE ON FUNCTION search_supplier_products TO authenticated;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TYPE product_variation_type IS 'Types of product variations: size, type, scent, packaging, material, flavor, other';
COMMENT ON TABLE supplier_products IS 'Junction table linking products with suppliers, containing supplier-specific pricing and inventory';
COMMENT ON TABLE product_variations IS 'Normalized storage of product variations (size, type, scent, etc.)';
COMMENT ON TABLE supplier_product_variations IS 'Links supplier_products with product_variations for supplier-specific variation SKUs and pricing';
COMMENT ON COLUMN supplier_products.price IS 'Supplier-specific selling price for this product';
COMMENT ON COLUMN supplier_products.previous_price IS 'Previous price for tracking price changes';
COMMENT ON COLUMN supplier_products.min_order_quantity IS 'Minimum quantity this supplier requires for orders';
COMMENT ON COLUMN supplier_products.delivery_days IS 'Number of days this supplier needs for delivery';
COMMENT ON COLUMN product_variations.variation_type IS 'Type of variation (size, type, scent, packaging, etc.)';
COMMENT ON COLUMN product_variations.variation_value IS 'Actual value of the variation (e.g., "4 LT", "BEYAZ", "LAVANTA")';
COMMENT ON COLUMN product_variations.metadata IS 'Additional metadata for structured variation data';
COMMENT ON COLUMN supplier_product_variations.price_adjustment IS 'Price adjustment for this variation (added to base price)';
COMMENT ON VIEW bugun_halde_comparison IS 'Compares products across all suppliers with price statistics for "Bugün Halde" feature';
COMMENT ON VIEW supplier_catalog_with_variations IS 'Complete supplier product catalog with all variations';
COMMENT ON FUNCTION get_product_suppliers IS 'Returns all suppliers for a product ordered by price (lowest first)';
COMMENT ON FUNCTION get_product_variations IS 'Returns all variations for a product grouped by type';
COMMENT ON FUNCTION get_product_price_stats IS 'Calculates min, max, avg prices and supplier count for a product';
COMMENT ON FUNCTION search_supplier_products IS 'Advanced search across supplier products with filters';
