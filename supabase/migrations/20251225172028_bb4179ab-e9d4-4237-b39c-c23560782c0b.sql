-- Create regions table
CREATE TABLE public.regions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  min_order_amount NUMERIC NOT NULL DEFAULT 150,
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  free_delivery_threshold NUMERIC DEFAULT 150,
  districts TEXT[] NOT NULL DEFAULT '{}',
  delivery_slots JSONB DEFAULT '[]',
  warehouse_address TEXT,
  warehouse_phone TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

-- Everyone can view active regions
CREATE POLICY "Anyone can view active regions"
ON public.regions
FOR SELECT
USING (is_active = true);

-- Admins can view all regions
CREATE POLICY "Admins can view all regions"
ON public.regions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage regions
CREATE POLICY "Admins can insert regions"
ON public.regions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update regions"
ON public.regions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete regions"
ON public.regions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_regions_updated_at
BEFORE UPDATE ON public.regions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create region_products table for regional pricing and stock
CREATE TABLE public.region_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  previous_price NUMERIC,
  availability availability_status NOT NULL DEFAULT 'plenty',
  is_active BOOLEAN NOT NULL DEFAULT true,
  stock_quantity INTEGER DEFAULT 100,
  price_change price_change NOT NULL DEFAULT 'stable',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(region_id, product_id)
);

-- Enable RLS
ALTER TABLE public.region_products ENABLE ROW LEVEL SECURITY;

-- Everyone can view active region products
CREATE POLICY "Anyone can view active region products"
ON public.region_products
FOR SELECT
USING (is_active = true);

-- Admins can view all region products
CREATE POLICY "Admins can view all region products"
ON public.region_products
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage region products
CREATE POLICY "Admins can insert region products"
ON public.region_products
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update region products"
ON public.region_products
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete region products"
ON public.region_products
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_region_products_updated_at
BEFORE UPDATE ON public.region_products
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add region_id to orders table
ALTER TABLE public.orders 
ADD COLUMN region_id UUID REFERENCES public.regions(id);

-- Create indexes
CREATE INDEX idx_regions_slug ON public.regions(slug);
CREATE INDEX idx_regions_is_active ON public.regions(is_active) WHERE is_active = true;
CREATE INDEX idx_region_products_region ON public.region_products(region_id);
CREATE INDEX idx_region_products_product ON public.region_products(product_id);
CREATE INDEX idx_region_products_active ON public.region_products(is_active) WHERE is_active = true;
CREATE INDEX idx_orders_region ON public.orders(region_id);