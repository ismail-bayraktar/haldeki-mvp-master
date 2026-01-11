-- ============================================================================
-- Variation Cleanup Diagnostic Query 2
-- Find All "type" Variations with "BEYAZ" Value
-- ============================================================================

-- Find variations where type is "type" and value is "BEYAZ" (color)
-- Color attribute is inappropriate for fresh produce
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
  AND pv.variation_value ILIKE '%BEYAZ%'
ORDER BY p.category, p.name;
