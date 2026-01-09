-- Phase 12 Deployment Verification
-- Run this to verify all tables, indexes, and policies are deployed

-- 1. Check tables exist
SELECT
  'supplier_products' as table_name,
  COUNT(*) as record_count
FROM supplier_products
UNION ALL
SELECT
  'product_variations',
  COUNT(*)
FROM product_variations
UNION ALL
SELECT
  'supplier_product_variations',
  COUNT(*)
FROM supplier_product_variations;

-- 2. Check indexes
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('supplier_products', 'product_variations', 'supplier_product_variations')
ORDER BY tablename, indexname;

-- 3. Check RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('supplier_products', 'product_variations', 'supplier_product_variations')
ORDER BY tablename, policyname;

-- 4. Check foreign key constraints (should be RESTRICT, not CASCADE)
SELECT
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as references_table,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid::regclass IN ('supplier_products')
  AND contype = 'f'
ORDER BY conrelid::regclass::text, conname;

-- 5. Check functions exist
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_product_suppliers',
    'get_product_variations',
    'get_product_price_stats',
    'search_supplier_products',
    'update_supplier_products_updated_at'
  )
ORDER BY routine_name;

-- 6. Check views exist
SELECT
  table_name as view_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('bugun_halde_comparison', 'supplier_catalog_with_variations')
ORDER BY table_name;

-- 7. Sample data check
SELECT
  p.name as product_name,
  s.name as supplier_name,
  sp.price,
  sp.availability,
  sp.stock_quantity
FROM supplier_products sp
JOIN products p ON p.id = sp.product_id
JOIN suppliers s ON s.id = sp.supplier_id
ORDER BY sp.price DESC
LIMIT 10;
