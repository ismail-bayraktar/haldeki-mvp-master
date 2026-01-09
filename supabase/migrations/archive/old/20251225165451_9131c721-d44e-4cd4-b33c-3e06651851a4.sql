-- Create enums for product types
CREATE TYPE public.product_unit AS ENUM ('kg', 'adet', 'demet', 'paket');
CREATE TYPE public.quality_grade AS ENUM ('premium', 'standart', 'ekonomik');
CREATE TYPE public.availability_status AS ENUM ('plenty', 'limited', 'last');
CREATE TYPE public.price_change AS ENUM ('up', 'down', 'stable');

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  unit product_unit NOT NULL DEFAULT 'kg',
  origin TEXT NOT NULL,
  quality quality_grade NOT NULL DEFAULT 'standart',
  arrival_date DATE,
  availability availability_status NOT NULL DEFAULT 'plenty',
  is_bugun_halde BOOLEAN NOT NULL DEFAULT false,
  price_change price_change NOT NULL DEFAULT 'stable',
  previous_price NUMERIC,
  images TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  variants JSONB DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Everyone can view active products (public catalog)
CREATE POLICY "Anyone can view active products"
ON public.products
FOR SELECT
USING (is_active = true);

-- Admins can view all products (including inactive)
CREATE POLICY "Admins can view all products"
ON public.products
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert products
CREATE POLICY "Admins can insert products"
ON public.products
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update products
CREATE POLICY "Admins can update products"
ON public.products
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete products
CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create index for common queries
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_is_bugun_halde ON public.products(is_bugun_halde) WHERE is_bugun_halde = true;
CREATE INDEX idx_products_is_active ON public.products(is_active) WHERE is_active = true;