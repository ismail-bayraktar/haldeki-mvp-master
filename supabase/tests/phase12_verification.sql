-- ============================================================================
-- Phase 12 Database Verification Script
-- Date: 2025-01-10
-- Purpose: Verify all Phase 12 objects are correctly deployed
-- ============================================================================
-- Run this in Supabase SQL Editor to verify Phase 12 deployment
-- ============================================================================

\echo '============================================================================'
\echo 'PHASE 12 DATABASE VERIFICATION'
\echo '============================================================================'
\echo ''

-- ============================================================================
-- 1. TABLES EXIST CHECK
-- ============================================================================
\echo '1. CHECKING TABLES EXIST...'
\echo '---------------------------------------------------------------------------'

SELECT
  'supplier_products' as table_name,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supplier_products') as exists
UNION ALL
SELECT
  'product_variations',
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_variations')
UNION ALL
SELECT
  'supplier_product_variations',
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supplier_product_variations');

\echo ''

-- ============================================================================
-- 2. TABLE STRUCTURES
-- ============================================================================
\echo '2. CHECKING TABLE STRUCTURES...'
\echo '---------------------------------------------------------------------------'

-- supplier_products structure
\echo 'supplier_products columns:'
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'supplier_products'
ORDER BY ordinal_position;

\echo ''
\echo 'product_variations columns:'
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'product_variations'
ORDER BY ordinal_position;

\echo ''
\echo 'supplier_product_variations columns:'
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'supplier_product_variations'
ORDER BY ordinal_position;

\echo ''

-- ============================================================================
-- 3. ENUM TYPE CHECK
-- ============================================================================
\echo '3. CHECKING ENUM TYPE...'
\echo '---------------------------------------------------------------------------'

SELECT typname, enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'product_variation_type'
ORDER BY enumsortorder;

\echo ''

-- ============================================================================
-- 4. INDEXES CHECK
-- ============================================================================
\echo '4. CHECKING INDEXES...'
\echo '---------------------------------------------------------------------------'

SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('supplier_products', 'product_variations', 'supplier_product_variations')
  AND schemaname = 'public'
ORDER BY tablename, indexname;

\echo ''

-- ============================================================================
-- 5. FUNCTIONS CHECK
-- ============================================================================
\echo '5. CHECKING RPC FUNCTIONS...'
\echo '---------------------------------------------------------------------------'

SELECT
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_product_suppliers', 'get_product_variations', 'get_product_price_stats', 'search_supplier_products')
ORDER BY routine_name;

\echo ''

-- ============================================================================
-- 6. VIEWS CHECK
-- ============================================================================
\echo '6. CHECKING VIEWS...'
\echo '---------------------------------------------------------------------------'

SELECT
  table_name as view_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('bugun_halde_comparison', 'supplier_catalog_with_variations');

\echo ''

-- ============================================================================
-- 7. RLS POLICIES CHECK
-- ============================================================================
\echo '7. CHECKING RLS POLICIES...'
\echo '---------------------------------------------------------------------------'

SELECT
  tablename,
  policyname,
  permissive,
  cmd,
  substr(qual, 1, 100) as condition_preview
FROM pg_policies
WHERE tablename IN ('supplier_products', 'product_variations', 'supplier_product_variations')
  AND schemaname = 'public'
ORDER BY tablename, policyname;

\echo ''

-- ============================================================================
-- 8. TRIGGERS CHECK
-- ============================================================================
\echo '8. CHECKING TRIGGERS...'
\echo '---------------------------------------------------------------------------'

SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('supplier_products', 'supplier_product_variations')
ORDER BY event_object_table, trigger_name;

\echo ''

-- ============================================================================
-- 9. DATA COUNT CHECK
-- ============================================================================
\echo '9. CHECKING DATA MIGRATION...'
\echo '---------------------------------------------------------------------------'

SELECT
  'supplier_products' as table_name,
  COUNT(*) as row_count
FROM public.supplier_products
UNION ALL
SELECT
  'product_variations',
  COUNT(*)
FROM public.product_variations
UNION ALL
SELECT
  'supplier_product_variations',
  COUNT(*)
FROM public.supplier_product_variations;

\echo ''

-- ============================================================================
-- 10. SAMPLE DATA CHECK
-- ============================================================================
\echo '10. SAMPLE DATA...'
\echo '---------------------------------------------------------------------------'

\echo 'supplier_products (first 5):'
SELECT *
FROM public.supplier_products
LIMIT 5;

\echo ''

\echo 'product_variations (first 5):'
SELECT *
FROM public.product_variations
LIMIT 5;

\echo ''

-- ============================================================================
-- 11. VIEW QUERY TEST
-- ============================================================================
\echo '11. TESTING VIEWS...'
\echo '---------------------------------------------------------------------------'

\echo 'bugun_halde_comparison (first 10):'
SELECT *
FROM public.bugun_halde_comparison
LIMIT 10;

\echo ''

-- ============================================================================
-- 12. FUNCTION TESTS
-- ============================================================================
\echo '12. TESTING RPC FUNCTIONS...'
\echo '---------------------------------------------------------------------------'

-- Test with a product_id that has suppliers
\echo 'get_product_suppliers test:'
SELECT * FROM public.get_product_suppliers(
  (SELECT id FROM public.supplier_products LIMIT 1)
);

\echo ''

\echo 'get_product_variations test:'
SELECT * FROM public.get_product_variations(
  (SELECT id FROM public.supplier_products LIMIT 1)
);

\echo ''

\echo 'get_product_price_stats test:'
SELECT * FROM public.get_product_price_stats(
  (SELECT id FROM public.supplier_products LIMIT 1)
);

\echo ''

-- ============================================================================
-- 13. CONSTRAINTS CHECK
-- ============================================================================
\echo '13. CHECKING CONSTRAINTS...'
\echo '---------------------------------------------------------------------------'

SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
JOIN pg_class cl ON cl.oid = c.conrelid
WHERE n.nspname = 'public'
  AND cl.relname IN ('supplier_products', 'product_variations', 'supplier_product_variations')
ORDER BY cl.relname, c.conname;

\echo ''

-- ============================================================================
-- 14. FOREIGN KEYS CHECK
-- ============================================================================
\echo '14. CHECKING FOREIGN KEY RELATIONSHIPS...'
\echo '---------------------------------------------------------------------------'

SELECT
  conname as fk_name,
  cl.relname as table_name,
  cl2.relname as references_table,
  pg_get_constraintdef(c.oid) as fk_definition
FROM pg_constraint c
JOIN pg_class cl ON cl.oid = c.conrelid
JOIN pg_class cl2 ON cl2.oid = c.confrelid
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE n.nspname = 'public'
  AND cl.relname IN ('supplier_products', 'product_variations', 'supplier_product_variations')
  AND contype = 'f'
ORDER BY cl.relname, c.conname;

\echo ''

-- ============================================================================
-- 15. GRANTS CHECK
-- ============================================================================
\echo '15. CHECKING PERMISSIONS...'
\echo '---------------------------------------------------------------------------'

SELECT
  grantee,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('supplier_products', 'product_variations', 'supplier_product_variations', 'bugun_halde_comparison')
ORDER BY table_name, privilege_type;

\echo ''

\echo '============================================================================'
\echo 'VERIFICATION COMPLETE'
\echo '============================================================================'
