-- Phase 11: Warehouse MVP - Unit Conversion Factor
-- Date: 2025-01-09
-- Purpose: Add conversion_factor column to products for unit standardization
-- NOTE: Used to convert all quantities to kg for picking list

-- ============================================
-- ADD COLUMN: conversion_factor
-- ============================================

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS conversion_factor NUMERIC DEFAULT 1.0;

-- ============================================
-- ADD CONSTRAINT: conversion_factor > 0
-- ============================================

ALTER TABLE public.products
DROP CONSTRAINT IF EXISTS products_conversion_factor_check;

ALTER TABLE public.products
ADD CONSTRAINT products_conversion_factor_check
CHECK (conversion_factor > 0);

-- ============================================
-- INDEX FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_conversion_factor
ON public.products(conversion_factor)
WHERE conversion_factor IS NOT NULL;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN public.products.conversion_factor IS
'Unit conversion factor to kg. Examples: 1kg = 1.0 (factor=1), 1 adet = 0.5kg (factor=0.5)';
COMMENT ON CONSTRAINT products_conversion_factor_check ON public.products IS
'Ensures conversion_factor is positive (> 0)';

-- ============================================
-- EXAMPLE USAGE (DOCUMENTATION ONLY)
-- ============================================

/*
Examples of conversion_factor values:

Product    Unit      conversion_factor    Meaning
--------    ------    -----------------    --------------------------------
Domates     kg        1.0                  1 kg = 1 kg
Salatalık   adet      0.5                  1 adet = 0.5 kg
Avokado     adet      0.3                  1 adet = 0.3 kg (approx)
Patlıcan    kg        1.0                  1 kg = 1 kg

Formula for picking list:
quantity_kg = quantity * conversion_factor

Examples:
- Domates: 5 kg * 1.0 = 5 kg
- Salatalık: 20 adet * 0.5 = 10 kg
- Avokado: 10 adet * 0.3 = 3 kg
*/
