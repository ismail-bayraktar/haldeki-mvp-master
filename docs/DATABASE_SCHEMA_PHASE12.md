# Multi-Supplier Product Management Schema Documentation

## Overview

Phase 12 introduces a comprehensive multi-supplier product management system with normalized variations, enabling:
- Multiple suppliers per product with individual pricing
- Structured variation storage (size, type, scent, packaging)
- Price comparison across suppliers ("Bugün Halde")
- Supplier-specific inventory and delivery timelines
- Regional pricing integration (unchanged)

## Architecture

### Design Decisions

1. **Junction Table Pattern**: `supplier_products` links products and suppliers
2. **Variation Normalization**: `product_variations` stores structured variation data
3. **Price per Supplier**: Each supplier sets their own price for the same product
4. **Performance**: Composite indexes for common query patterns
5. **Security**: RLS policies for supplier access control

### Normalization Level

- **Third Normal Form (3NF)**: All tables are fully normalized
- **No data redundancy**: Each variation stored once
- **Referential integrity**: Foreign keys ensure data consistency

## Schema Structure

### Tables

#### 1. `supplier_products` (Junction Table)

Links products with suppliers, containing supplier-specific data.

**Key Columns:**
- `supplier_id` (FK) → suppliers.id
- `product_id` (FK) → products.id
- `price`, `previous_price`, `price_change`
- `stock_quantity`, `availability`
- `quality`, `origin`
- `min_order_quantity`, `delivery_days`
- `is_active`, `is_featured`

**Constraints:**
- UNIQUE(supplier_id, product_id)
- price > 0 CHECK constraint
- stock_quantity >= 0 CHECK constraint

**Indexes:**
- `idx_supplier_products_supplier_id`
- `idx_supplier_products_product_id`
- `idx_supplier_products_product_price` (for comparison)
- `idx_supplier_products_active`
- `idx_supplier_products_featured`

#### 2. `product_variations`

Normalized storage of product variations.

**Key Columns:**
- `product_id` (FK) → products.id
- `variation_type` (ENUM: size, type, scent, packaging, material, flavor, other)
- `variation_value` (TEXT: "4 LT", "BEYAZ", "LAVANTA", "*4")
- `display_order` (INTEGER)
- `metadata` (JSONB: structured variation data)

**Constraints:**
- UNIQUE(product_id, variation_type, variation_value)

**Indexes:**
- `idx_product_variations_product_id`
- `idx_product_variations_type`
- `idx_product_variations_display_order`

#### 3. `supplier_product_variations` (Junction Table)

Links `supplier_products` with `product_variations`.

**Key Columns:**
- `supplier_product_id` (FK) → supplier_products.id
- `variation_id` (FK) → product_variations.id
- `price_adjustment` (price delta for this variation)
- `stock_quantity` (supplier stock for this variation)
- `supplier_variation_sku` (supplier's internal SKU)

**Constraints:**
- UNIQUE(supplier_product_id, variation_id)

**Indexes:**
- `idx_supplier_product_variations_supplier_product`
- `idx_supplier_product_variations_variation`

### Enum Types

```sql
CREATE TYPE product_variation_type AS ENUM (
  'size',      -- 4 LT, 1,5 KG, 500 ML
  'type',      -- BEYAZ, RENKLİ, SIVI, TOZ
  'scent',     -- LAVANTA, LIMON, PORÇEL
  'packaging', -- *4 (4-pack), *6, *12
  'material',  -- CAM, PLASTIK, METAL
  'flavor',    -- VANILLA, CİLEK, ÇİKOLATA
  'other'      -- Catch-all for custom variations
);
```

## Views

### `bugun_halde_comparison`

Compares products across all suppliers with price statistics.

**Columns:**
- Product info: `product_id`, `product_name`, `category_name`, `unit`, `image_url`
- Supplier info: `supplier_id`, `supplier_name`, `price`, `availability`
- Market stats: `market_min_price`, `market_max_price`, `market_avg_price`, `total_suppliers`
- Flags: `is_lowest_price`, `is_featured`

**Usage:**
```sql
-- Get all suppliers for a product, ordered by price
SELECT * FROM bugun_halde_comparison
WHERE product_id = 'uuid-here'
ORDER BY price ASC;

-- Find products with price drops
SELECT * FROM bugun_halde_comparison
WHERE price_change = 'decreased'
ORDER BY updated_at DESC;
```

### `supplier_catalog_with_variations`

Complete supplier product catalog with all variations.

**Columns:**
- Supplier: `supplier_id`, `supplier_name`
- Product: `product_id`, `product_name`, `category_name`, `unit`
- Pricing: `price`, `availability`, `stock_quantity`, `is_featured`
- Variations: `variations` (JSONB array of all variations)

**Usage:**
```sql
-- Get all products from a supplier with variations
SELECT * FROM supplier_catalog_with_variations
WHERE supplier_id = 'uuid-here'
ORDER BY product_name;
```

## Functions

### `get_product_suppliers(product_id UUID)`

Returns all suppliers for a product ordered by price.

**Returns:**
- Supplier info: `supplier_id`, `supplier_name`
- Pricing: `price`, `previous_price`, `price_change`
- Inventory: `availability`, `stock_quantity`, `quality`
- Delivery: `delivery_days`
- Flags: `is_featured`

**Example:**
```sql
SELECT * FROM get_product_suppliers('product-uuid');
```

### `get_product_variations(product_id UUID)`

Returns all variations for a product grouped by type.

**Returns:**
- `variation_type`, `variation_value`, `display_order`, `metadata`

**Example:**
```sql
SELECT * FROM get_product_variations('product-uuid');
```

### `get_product_price_stats(product_id UUID)`

Calculates price statistics across all suppliers.

**Returns:**
- `min_price`, `max_price`, `avg_price`, `supplier_count`

**Example:**
```sql
SELECT * FROM get_product_price_stats('product-uuid');
```

### `search_supplier_products(...)`

Advanced search across supplier products with filters.

**Parameters:**
- `p_supplier_id UUID`: Supplier to search
- `p_search_text TEXT`: Search in product name
- `p_variation_types product_variation_type[]`: Filter by variation types
- `p_min_price NUMERIC`: Minimum price
- `p_max_price NUMERIC`: Maximum price

**Example:**
```sql
SELECT * FROM search_supplier_products(
  'supplier-uuid',
  'Domates',
  ARRAY['size']::product_variation_type[],
  10,
  50
);
```

## RLS Policies

### supplier_products

| Policy | Role | Access | Condition |
|--------|------|--------|-----------|
| Public can view active supplier products | public/authenticated | SELECT | is_active = true |
| Suppliers can view their own products | authenticated | SELECT | supplier_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid()) |
| Suppliers can insert their own products | authenticated | INSERT | user_id = auth.uid() AND approval_status = 'approved' |
| Suppliers can update their own products | authenticated | UPDATE | user_id = auth.uid() |
| Suppliers can delete their own products | authenticated | DELETE | user_id = auth.uid() |
| Admins can manage all | authenticated | ALL | role IN ('admin', 'superadmin') |

### product_variations

| Policy | Role | Access | Condition |
|--------|------|--------|-----------|
| Authenticated users can view | authenticated | SELECT | - |
| Admins can insert | authenticated | INSERT | role IN ('admin', 'superadmin') |
| Admins can update | authenticated | UPDATE | role IN ('admin', 'superadmin') |
| Admins can delete | authenticated | DELETE | role IN ('admin', 'superadmin') |

### supplier_product_variations

Inherits from `supplier_products` policies.

## Integration with Existing System

### Products Table

- `supplier_id` column remains (for backward compatibility)
- `product_status` column: 'active', 'inactive', 'out_of_stock'
- `last_modified_by`, `last_modified_at` columns (from Phase 9)

### Suppliers Table

- No changes required
- `approval_status` column: 'pending', 'approved', 'rejected'
- `is_active` column for supplier status

### Region Products Table

- **No changes required**
- Regional pricing remains at product level
- Not affected by supplier-specific pricing

## Query Patterns

### Get Product with All Suppliers

```sql
SELECT
  p.name,
  p.category_name,
  bhc.supplier_name,
  bhc.price,
  bhc.is_lowest_price
FROM products p
INNER JOIN bugun_halde_comparison bhc ON bhc.product_id = p.id
WHERE p.id = 'uuid'
ORDER BY bhc.price ASC;
```

### Get Supplier's Product Catalog

```sql
SELECT
  product_name,
  price,
  availability,
  variations
FROM supplier_catalog_with_variations
WHERE supplier_id = 'uuid'
ORDER BY product_name;
```

### Find Best Price for Product

```sql
SELECT supplier_name, price
FROM bugun_halde_comparison
WHERE product_id = 'uuid'
ORDER BY price ASC
LIMIT 1;
```

### Price Comparison Across Suppliers

```sql
SELECT
  product_name,
  supplier_name,
  price,
  market_min_price,
  market_avg_price,
  ((price - market_min_price) / market_min_price * 100)::NUMERIC(5,2) as premium_pct
FROM bugun_halde_comparison
WHERE product_id = 'uuid'
ORDER BY price ASC;
```

## Performance Considerations

### Indexes

All indexes are optimized for common query patterns:

1. **Product → Suppliers**: `idx_supplier_products_product_price`
2. **Supplier → Products**: `idx_supplier_products_supplier_active_updated`
3. **Variations**: `idx_product_variations_product_id`
4. **Price Changes**: `idx_supplier_products_price_change`

### Partial Indexes

Partial indexes (with WHERE clause) are used for:
- Active products only: `WHERE is_active = true`
- Featured products: `WHERE is_featured = true`
- Price changes: `WHERE price_change != 'stable'`

This reduces index size and improves write performance.

### Composite Indexes

Composite indexes support these query patterns:
- `(product_id, price)`: Sort suppliers by price for a product
- `(supplier_id, is_active, updated_at DESC)`: Supplier's active products with pagination

## Migration Strategy

### Phase 1: Schema Creation

Run `20250110000000_phase12_multi_supplier_products.sql`:
- Creates tables, indexes, functions, views
- Sets up RLS policies
- No data loss

### Phase 2: Data Migration

Run `20250110010000_phase12_data_migration.sql`:
- Migrates existing products with `supplier_id` to `supplier_products`
- Extracts variations from product names (regex patterns)
- Links variations to supplier_products
- **Can be run multiple times safely (ON CONFLICT DO NOTHING)**

### Phase 3: Verification

Check migration results:
```sql
-- Count migrated products
SELECT COUNT(*) FROM supplier_products;

-- Find orphan products (no supplier)
SELECT name, category_name
FROM products
WHERE NOT EXISTS (
  SELECT 1 FROM supplier_products WHERE product_id = products.id
);

-- Check variation extraction
SELECT variation_type, COUNT(DISTINCT product_id)
FROM product_variations
GROUP BY variation_type;
```

## Rollback Plan

If needed, rollback with `20250110020000_phase12_rollback.sql`:

**WARNING**: This will PERMANENTLY DELETE all `supplier_products` data.

Before rollback:
1. **Full database backup required**
2. **Test on staging environment**
3. **Get approval from system owner**

Rollback process:
1. Drops views and functions
2. Drops RLS policies
3. Drops indexes
4. Drops tables (CASCADE)
5. Drops enum type
6. Products table remains in pre-Phase 12 state

## Future Enhancements

### Possible Improvements

1. **Bulk Pricing**: Add quantity-based price tiers
2. **Supplier Ratings**: Add rating/review system for suppliers
3. **Product Variants**: Create separate product SKUs for variations
4. **Price History**: Track price changes over time (time-series)
5. **Supplier Performance**: Track delivery times, stock reliability
6. **Regional Suppliers**: Link suppliers to specific regions

### Scalability Considerations

1. **Caching**: Cache `bugun_halde_comparison` results (Redis)
2. **Materialized Views**: For heavy analytics queries
3. **Partitioning**: Partition `supplier_products` by supplier_id if >1M rows
4. **Read Replicas**: Offload read queries to replicas

## Testing

### Unit Tests

```sql
-- Test: Get all suppliers for product
SELECT * FROM get_product_suppliers('product-uuid');

-- Test: Price stats calculation
SELECT * FROM get_product_price_stats('product-uuid');

-- Test: Variation extraction
SELECT * FROM get_product_variations('product-uuid');
```

### Integration Tests

```sql
-- Test: Insert supplier_product
INSERT INTO supplier_products (supplier_id, product_id, price)
VALUES ('supplier-uuid', 'product-uuid', 100);

-- Test: Add variation
INSERT INTO product_variations (product_id, variation_type, variation_value)
VALUES ('product-uuid', 'size', '4 LT');

-- Test: Link variation to supplier_product
INSERT INTO supplier_product_variations (supplier_product_id, variation_id)
VALUES ('supplier-product-uuid', 'variation-uuid');
```

### Performance Tests

```sql
-- Test: Explain query plan for comparison
EXPLAIN ANALYZE
SELECT * FROM bugun_halde_comparison
WHERE product_id = 'uuid';

-- Test: Explain query plan for supplier catalog
EXPLAIN ANALYZE
SELECT * FROM supplier_catalog_with_variations
WHERE supplier_id = 'uuid';
```

## Support

For issues or questions:
1. Check this documentation
2. Review migration logs
3. Test queries on staging environment
4. Contact database architect

## Changelog

### Phase 12 (2025-01-10)
- Initial multi-supplier product management system
- Normalized variation storage
- Price comparison views
- RLS policies for security
- Data migration from existing schema
