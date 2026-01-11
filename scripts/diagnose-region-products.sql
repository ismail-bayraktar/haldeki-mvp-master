-- =====================================================
-- REGION & PRODUCTS DIAGNOSTIC QUERIES
-- Run these queries in Supabase SQL Editor
-- =====================================================

-- 1. CHECK REGIONS TABLE STRUCTURE AND DATA
-- ==========================================

-- Show regions table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'regions'
ORDER BY ordinal_position;

-- Check all regions and their active status
SELECT
    id,
    name,
    slug,
    is_active,
    created_at,
    updated_at
FROM regions
ORDER BY id;

-- Count active vs inactive regions
SELECT
    is_active,
    COUNT(*) as count
FROM regions
GROUP BY is_active;


-- 2. CHECK PRODUCTS WITH REGION PRICING
-- =====================================

-- Count total products
SELECT COUNT(*) as total_products FROM products;

-- Count products with region_products entries
SELECT COUNT(DISTINCT product_id) as products_with_regions
FROM region_products;

-- Count products WITHOUT region_products entries
SELECT COUNT(*) as products_without_regions
FROM products p
WHERE NOT EXISTS (
    SELECT 1 FROM region_products rp WHERE rp.product_id = p.id
);

-- Show sample products missing region_products
SELECT
    p.id,
    p.name,
    p.slug,
    p.is_active,
    p.created_at
FROM products p
WHERE NOT EXISTS (
    SELECT 1 FROM region_products rp WHERE rp.product_id = p.id
)
ORDER BY p.created_at DESC
LIMIT 20;


-- 3. CHECK REGION_PRODUCTS TABLE
-- ===============================

-- Count total region_products entries
SELECT COUNT(*) as total_region_products FROM region_products;

-- Count region_products by region
SELECT
    r.name as region_name,
    r.is_active as region_is_active,
    COUNT(*) as product_count
FROM region_products rp
JOIN regions r ON r.id = rp.region_id
GROUP BY r.id, r.name, r.is_active
ORDER BY r.id;

-- Check for products with missing regions (orphaned entries)
SELECT
    rp.id,
    rp.product_id,
    rp.region_id,
    'Region missing in regions table' as issue
FROM region_products rp
LEFT JOIN regions r ON r.id = rp.region_id
WHERE r.id IS NULL;

-- Check for region_products pointing to missing products
SELECT
    rp.id,
    rp.product_id,
    rp.region_id,
    'Product missing in products table' as issue
FROM region_products rp
LEFT JOIN products p ON p.id = rp.product_id
WHERE p.id IS NULL;


-- 4. CHECK SUPPLIER_PRODUCTS TABLE
-- =================================

-- Count total supplier_products entries
SELECT COUNT(*) as total_supplier_products FROM supplier_products;

-- Count products with supplier_products
SELECT COUNT(DISTINCT product_id) as products_with_suppliers
FROM supplier_products;

-- Count products WITHOUT supplier_products
SELECT COUNT(*) as products_without_suppliers
FROM products p
WHERE NOT EXISTS (
    SELECT 1 FROM supplier_products sp WHERE sp.product_id = p.id
);

-- Show sample products missing supplier_products
SELECT
    p.id,
    p.name,
    p.slug,
    p.is_active,
    p.created_at
FROM products p
WHERE NOT EXISTS (
    SELECT 1 FROM supplier_products sp WHERE sp.product_id = p.id
)
ORDER BY p.created_at DESC
LIMIT 20;


-- 5. COMPREHENSIVE PRODUCT STATUS REPORT
-- =======================================

-- Summary of product data completeness
SELECT
    'Total Products' as metric,
    COUNT(*)::text as value
FROM products
UNION ALL
SELECT
    'Products with region pricing' as metric,
    COUNT(DISTINCT product_id)::text
FROM region_products
UNION ALL
SELECT
    'Products with suppliers' as metric,
    COUNT(DISTINCT product_id)::text
FROM supplier_products
UNION ALL
SELECT
    'Products WITHOUT region pricing' as metric,
    COUNT(*)::text
FROM products p
WHERE NOT EXISTS (
    SELECT 1 FROM region_products rp WHERE rp.product_id = p.id
)
UNION ALL
SELECT
    'Products WITHOUT suppliers' as metric,
    COUNT(*)::text
FROM products p
WHERE NOT EXISTS (
    SELECT 1 FROM supplier_products sp WHERE sp.product_id = p.id
);


-- 6. CHECK ACTIVE PRODUCTS IN ACTIVE REGIONS
-- ==========================================

-- Count active products with pricing in active regions
SELECT COUNT(DISTINCT rp.product_id) as active_products_in_active_regions
FROM region_products rp
JOIN products p ON p.id = rp.product_id
JOIN regions r ON r.id = rp.region_id
WHERE p.is_active = true
  AND r.is_active = true;

-- Count active products with pricing in INACTIVE regions
SELECT COUNT(DISTINCT rp.product_id) as active_products_in_inactive_regions
FROM region_products rp
JOIN products p ON p.id = rp.product_id
JOIN regions r ON r.id = rp.region_id
WHERE p.is_active = true
  AND r.is_active = false;


-- 7. SAMPLE PRODUCT WITH FULL DETAILS
-- ====================================

-- Show full details for first 10 products
SELECT
    p.id as product_id,
    p.name as product_name,
    p.slug as product_slug,
    p.is_active as product_is_active,
    r.id as region_id,
    r.name as region_name,
    r.is_active as region_is_active,
    rp.price as region_price,
    rp.currency,
    (SELECT COUNT(*) FROM supplier_products sp WHERE sp.product_id = p.id) as supplier_count
FROM products p
LEFT JOIN region_products rp ON rp.product_id = p.id
LEFT JOIN regions r ON r.id = rp.region_id
ORDER BY p.id, r.id
LIMIT 50;
