-- ============================================================================
-- Variation Cleanup Diagnostic Query 5
-- Complete Variation Inventory
-- ============================================================================

-- Full inventory of all variations in database
-- Shows each unique variation value with count and categories
SELECT
  pv.variation_type,
  pv.variation_value,
  COUNT(*) AS count,
  COUNT(DISTINCT pv.product_id) AS product_count,
  STRING_AGG(DISTINCT p.category, ', ') AS categories
FROM public.product_variations pv
LEFT JOIN public.products p ON p.id = pv.product_id
GROUP BY pv.variation_type, pv.variation_value
ORDER BY pv.variation_type, pv.variation_value;
