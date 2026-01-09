-- ============================================================================
-- Phase 12: Create Product Variations Table
-- Date: 2025-01-10 15:00
-- Purpose: Add product_variations table for Phase 12 multi-supplier system
-- ============================================================================

-- Create product_variations table
CREATE TABLE IF NOT EXISTS public.product_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variation_type TEXT NOT NULL CHECK (variation_type IN ('size', 'type', 'scent', 'packaging', 'material', 'flavor', 'other')),
  variation_value TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_product_variations_product_id ON public.product_variations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variations_type ON public.product_variations(variation_type);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_product_variations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_variations_updated_at
  BEFORE UPDATE ON public.product_variations
  FOR EACH ROW
  EXECUTE FUNCTION update_product_variations_updated_at();

-- Enable RLS
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view product variations"
ON public.product_variations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage product variations"
ON public.product_variations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
  )
);

-- Create RPC function to get variations for a product
CREATE OR REPLACE FUNCTION get_product_variations(p_product_id UUID)
RETURNS TABLE (
  id UUID,
  product_id UUID,
  variation_type TEXT,
  variation_value TEXT,
  display_order INTEGER,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pv.id,
    pv.product_id,
    pv.variation_type,
    pv.variation_value,
    pv.display_order,
    pv.metadata
  FROM public.product_variations pv
  WHERE pv.product_id = p_product_id
  ORDER BY pv.variation_type, pv.display_order, pv.variation_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_product_variations(UUID) TO authenticated;

-- Comment
COMMENT ON TABLE public.product_variations IS 'Product variations (size, type, scent, etc.) for Phase 12 multi-supplier system';
