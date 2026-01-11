-- ============================================================================
-- Variation Cleanup Diagnostic Query 4
-- Find All "type" Variations (Review Required)
-- ============================================================================

-- All "type" variations - review each one
-- Some may be valid (liquid/powder), others invalid (color)
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
WHERE pv.variation_type = 'type'
ORDER BY p.category, pv.variation_value, p.name;
