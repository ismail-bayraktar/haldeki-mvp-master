-- ============================================================================
-- Variation Cleanup Diagnostic Query 6
-- Find All "beden" Variations
-- ============================================================================

-- Find any variations with type "beden" (Turkish clothing size term)
-- This should NOT exist in the database due to CHECK constraint
-- But check just in case data was inserted before constraint
SELECT
  pv.id,
  pv.product_id,
  p.name AS product_name,
  p.category AS product_category,
  pv.variation_type,
  pv.variation_value,
  pv.display_order,
  pv.metadata
FROM public.product_variations pv
LEFT JOIN public.products p ON p.id = pv.product_id
WHERE pv.variation_type ILIKE '%beden%'
ORDER BY p.name;
