-- Migration: Add variants column to products table
-- =======================================================

-- Add variants column as JSONB (for product variations like 500g, 1kg, etc.)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.products.variants IS 'Ürün varyasyonları (500g, 1kg, demet vs.) - JSON array formatında';

-- Example variant structure:
-- [
--   {"id": "500g", "label": "500 gram", "quantity": 0.5, "unit": "kg", "priceMultiplier": 1, "isDefault": true},
--   {"id": "1kg", "label": "1 kilogram", "quantity": 1, "unit": "kg", "priceMultiplier": 1}
-- ]

