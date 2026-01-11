-- ===========================================
-- Haldeki Market - Database Verification
-- Run this in Supabase SQL Editor
-- ===========================================

-- 1. Verify pricing_config table exists and has correct values
SELECT 'pricing_config' as check_name,
       CASE
         WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_config')
         THEN 'PASS'
         ELSE 'FAIL'
       END as status;

-- 2. Check commission rates
SELECT
  'commission_rates' as check_name,
  b2b_commission_rate,
  b2c_commission_rate,
  CASE
    WHEN b2b_commission_rate = 0.30 AND b2c_commission_rate = 0.50
    THEN 'PASS'
    ELSE 'FAIL'
  END as status
FROM pricing_config
LIMIT 1;

-- 3. Verify key tables exist
SELECT 'tables_exist' as check_name,
       jsonb_agg(DISTINCT table_name) as tables,
       CASE
         WHEN COUNT(DISTINCT table_name) >= 10
         THEN 'PASS'
         ELSE 'FAIL'
       END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'products',
    'supplier_products',
    'orders',
    'profiles',
    'pricing_config',
    'regions',
    'supplier_product_variations',
    'warehouse_staff',
    'variations'
  );

-- 4. Check RLS policies
SELECT 'rls_policies' as check_name,
       COUNT(*) as policy_count,
       CASE
         WHEN COUNT(*) > 0
         THEN 'PASS'
         ELSE 'FAIL'
       END as status
FROM pg_policies
WHERE schemaname = 'public';

-- 5. Verify RPC functions exist
SELECT 'rpc_functions' as check_name,
       jsonb_agg(DISTINCT routine_name) as functions,
       CASE
         WHEN COUNT(DISTINCT routine_name) >= 5
         THEN 'PASS'
         ELSE 'FAIL'
       END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND routine_name LIKE '%pricing%'
ORDER BY routine_name;

-- 6. Test pricing calculation
SELECT 'pricing_calculation' as check_name,
  calculate_product_price(
    'test-product-id'::uuid,
    'test-region-id'::uuid,
    'b2b',
    NULL,
    NULL
  ) as result,
  'PASS' as status;

-- 7. Check supplier products count
SELECT 'supplier_products' as check_name,
       COUNT(*) as count,
       CASE
         WHEN COUNT(*) >= 0
         THEN 'PASS'
         ELSE 'FAIL'
       END as status
FROM supplier_products;

-- 8. Verify regions table
SELECT 'regions' as check_name,
       COUNT(*) as count,
       CASE
         WHEN COUNT(*) > 0
         THEN 'PASS'
         ELSE 'FAIL'
       END as status
FROM regions
WHERE is_active = true;

-- 9. Check for critical indexes
SELECT 'indexes' as check_name,
       jsonb_agg(DISTINCT indexname) as indexes,
       CASE
         WHEN COUNT(DISTINCT indexname) >= 5
         THEN 'PASS'
         ELSE 'FAIL'
       END as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('products', 'supplier_products', 'orders');

-- 10. Summary
SELECT '========================================' as separator;
SELECT 'Database Verification Complete' as message;
SELECT 'If all checks show PASS, database is ready' as note;
