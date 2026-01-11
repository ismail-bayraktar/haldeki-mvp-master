-- ============================================================================
-- Migration: Add variation type statistics RPC function
-- Date: 2026-01-11
-- Purpose: Provide statistics for variation types management page
-- ============================================================================

-- Create or replace function to get variation type statistics
CREATE OR REPLACE FUNCTION get_variation_type_stats()
RETURNS TABLE (
  type TEXT,
  count BIGINT,
  sample_values TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pv.variation_type::TEXT,
    COUNT(*)::BIGINT,
    ARRAY_AGG(DISTINCT pv.variation_value ORDER BY pv.variation_value) FILTER (WHERE n <= 5)
  FROM public.product_variations pv
  CROSS JOIN LATERAL (
    SELECT ROW_NUMBER() OVER (PARTITION BY pv.variation_type ORDER BY pv.variation_value) as n
  ) ranked
  GROUP BY pv.variation_type
  ORDER BY count DESC;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_variation_type_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_variation_type_stats() TO service_role;

-- Add comment
COMMENT ON FUNCTION get_variation_type_stats() IS '
Returns statistics for product variation types.
Each row includes the type name, total count, and sample values.
Used by admin variation types management page.
';
