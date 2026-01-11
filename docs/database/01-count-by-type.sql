-- ============================================================================
-- Variation Cleanup Diagnostic Query 1
-- Count Variations by Type
-- ============================================================================

-- Get count of all variations grouped by type
SELECT
  variation_type,
  COUNT(*) AS variation_count,
  COUNT(DISTINCT product_id) AS product_count
FROM public.product_variations
GROUP BY variation_type
ORDER BY variation_count DESC;
