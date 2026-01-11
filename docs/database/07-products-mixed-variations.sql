-- ============================================================================
-- Variation Cleanup Diagnostic Query 7
-- Find Products with Multiple Variation Types
-- ============================================================================

-- Products that have multiple different variation types
-- This helps identify products with mixed valid/invalid variations
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.category,
  COUNT(DISTINCT pv.variation_type) AS type_count,
  STRING_AGG(DISTINCT pv.variation_type, ', ' ORDER BY pv.variation_type) AS types_used,
  COUNT(pv.id) AS total_variations
FROM public.products p
INNER JOIN public.product_variations pv ON pv.product_id = p.id
GROUP BY p.id, p.name, p.category
HAVING COUNT(DISTINCT pv.variation_type) > 1
ORDER BY type_count DESC, p.name;
