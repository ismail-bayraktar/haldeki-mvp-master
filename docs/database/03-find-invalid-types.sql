-- ============================================================================
-- Variation Cleanup Diagnostic Query 3
-- Find All Invalid Type Variations (scent, material, flavor)
-- ============================================================================

-- Find variations with types inappropriate for fresh food market
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
WHERE pv.variation_type IN ('scent', 'material', 'flavor')
ORDER BY pv.variation_type, p.category, p.name;
