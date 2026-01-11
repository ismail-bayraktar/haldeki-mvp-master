# Product Database Structure Analysis
**Date:** 2026-01-11
**Issue:** Products visible in admin panel but not shown on website due to region activation issues

---

## Executive Summary

The database has a **multi-layer product architecture** with 5 interconnected tables. The core issue is that **products require explicit region assignment** to be visible on the frontend. Without a `region_products` entry, products appear in admin (which queries `products` directly) but not on the website (which requires region-specific pricing).

---

## Database Architecture

### Core Tables

```
products (master catalog)
    |
    +-- supplier_products (Phase 12: multi-supplier pricing)
    |
    +-- region_products (regional pricing & stock)
    |
    +-- product_variations (size, type, scent variants)
            |
            +-- supplier_product_variations (supplier-specific variants)
```

### Table Details

#### 1. `products` (Master Catalog)
**Purpose:** Central product definition store

**Key Columns:**
- `id` (UUID, PK)
- `name`, `slug` (product identity)
- `category` (grouping)
- `unit` (kg, adet, demet, paket)
- `base_price` (legacy, deprecated in Phase 12)
- `images`, `description`, `origin`
- `quality` (premium, standart, ekonomik)
- `availability` (plenty, limited, last)
- `price_change` (up, down, stable)
- `is_bugun_halde` (featured flag)
- `is_active` (master switch)

**RLS Policy:**
```sql
-- Anyone can view active products
CREATE POLICY "Anyone can view active products"
ON products FOR SELECT USING (is_active = true);
```

**Indexes:**
- `idx_products_slug`
- `idx_products_category`
- `idx_products_is_active`
- `idx_products_is_bugun_halde`

---

#### 2. `region_products` (Regional Pricing & Stock)
**Purpose:** Product availability per region with pricing

**Key Columns:**
- `id` (UUID, PK)
- `region_id` (FK -> regions.id)
- `product_id` (FK -> products.id)
- `price` (customer-facing price)
- `business_price` (B2B price, nullable)
- `previous_price` (for price change tracking)
- `price_change` (up, down, stable)
- `availability` (plenty, limited, last)
- `stock_quantity` (integer, default 100)
- `is_active` (boolean, default true)
- UNIQUE(region_id, product_id)

**RLS Policy:**
```sql
-- Anyone can view active region products
CREATE POLICY "Anyone can view active region products"
ON region_products FOR SELECT USING (is_active = true);
```

**Critical Constraint:**
Each product must have a `region_products` entry to be visible in that region!

**Indexes:**
- `idx_region_products_region`
- `idx_region_products_product`
- `idx_region_products_active` (partial)

---

#### 3. `supplier_products` (Phase 12: Multi-Supplier)
**Purpose:** Link products to suppliers with supplier-specific pricing

**Key Columns:**
- `id` (UUID, PK)
- `supplier_id` (FK -> suppliers.id)
- `product_id` (FK -> products.id)
- `price` (supplier's selling price)
- `previous_price` (for tracking)
- `price_change` (auto-calculated)
- `stock_quantity` (supplier inventory)
- `availability` (supplier availability)
- `is_active` (boolean)
- `is_featured` (bugun halde flag)
- `quality`, `origin` (may differ by supplier)
- `supplier_sku` (supplier's internal code)
- `min_order_quantity` (MOQ)
- `delivery_days` (lead time)
- UNIQUE(supplier_id, product_id)

**RLS Policy:**
```sql
-- Public can view active supplier products
CREATE POLICY "Public can view active supplier products"
ON supplier_products FOR SELECT USING (is_active = true);
```

**Indexes:**
- `idx_supplier_products_supplier_id`
- `idx_supplier_products_product_id`
- `idx_supplier_products_active` (composite)
- `idx_supplier_products_product_price` (for comparison)

---

#### 4. `product_variations` (Normalized Variations)
**Purpose:** Define possible variations (size, type, scent, etc.)

**Key Columns:**
- `id` (UUID, PK)
- `product_id` (FK -> products.id)
- `variation_type` (ENUM: size, type, scent, packaging, material, flavor, other)
- `variation_value` (TEXT: "4 LT", "BEYAZ", "LAVANTA")
- `display_order` (INTEGER)
- `metadata` (JSONB: structured data)
- UNIQUE(product_id, variation_type, variation_value)

**Indexes:**
- `idx_product_variations_product_id`
- `idx_product_variations_type`
- `idx_product_variations_display_order`

---

#### 5. `supplier_product_variations` (Supplier-Specific Variants)
**Purpose:** Link variations to suppliers with pricing adjustments

**Key Columns:**
- `id` (UUID, PK)
- `supplier_product_id` (FK -> supplier_products.id)
- `variation_id` (FK -> product_variations.id)
- `supplier_variation_sku` (TEXT)
- `price_adjustment` (NUMERIC, added to base price)
- `stock_quantity` (variant-specific stock)
- UNIQUE(supplier_product_id, variation_id)

**Indexes:**
- `idx_supplier_product_variations_supplier_product`
- `idx_supplier_product_variations_variation`

---

## Region Activation Logic

### Why Products Don't Show on Website

**The Problem:**
1. Admin panel queries `products` directly (shows all active products)
2. Website queries require `region_products` join for pricing
3. **No `region_products` entry = product not in that region**

**Query Pattern (BugunHalde.tsx):**
```typescript
// Fetches products
useBugunHaldeProducts() -> supplier_products (Phase 12)

// Fetches region-specific pricing
useRegionProducts(regionId) -> region_products

// Client-side merge
mergeProductsWithRegion(products, regionProducts)
```

**Merge Logic (productUtils.ts):**
```typescript
export function mergeProductsWithRegion(
  products: Product[],
  regionProducts: RegionProductInfo[]
): ProductWithRegionInfo[] {
  const regionMap = new Map(regionProducts.map((rp) => [rp.product_id, rp]));

  return products.map((product) => {
    const regionRow = regionMap.get(product.id);

    return {
      ...product,
      regionInfo: regionRow
        ? { /* has region pricing */ }
        : null, // NULL = "Bu bölgede yok"
    };
  });
}
```

**Result:**
- Product exists in `products` -> visible in admin
- No `region_products` entry -> `regionInfo = null` -> shows "Bu bölgede satılmamaktadır"

---

### Region Activation Requirements

For a product to be visible in a region:

1. **products.is_active = true**
2. **products.is_bugun_halde = true** (for Bugün Halde page)
3. **region_products.is_active = true**
4. **region_products.stock_quantity > 0**
5. **regions.is_active = true** (region itself must be active)

---

## Views & Helper Functions

### 1. `bugun_halde_comparison` View
**Purpose:** Compare products across suppliers

```sql
CREATE VIEW bugun_halde_comparison AS
SELECT
  p.id as product_id,
  p.name as product_name,
  p.category,
  s.id as supplier_id,
  s.name as supplier_name,
  sp.price,
  sp.price_change,
  sp.availability,
  sp.is_featured,
  stats.min_price,
  stats.max_price,
  stats.supplier_count,
  CASE WHEN sp.price = stats.min_price THEN true ELSE false END as is_lowest_price
FROM products p
INNER JOIN supplier_products sp ON sp.product_id = p.id
INNER JOIN suppliers s ON s.id = sp.supplier_id
INNER JOIN LATERAL (
  SELECT MIN(spi.price), MAX(spi.price), COUNT(*)
  FROM supplier_products spi
  WHERE spi.product_id = p.id AND spi.is_active = true
) stats ON true
WHERE sp.is_active = true AND s.is_active = true;
```

### 2. `calculate_product_price()` Function
**Purpose:** Centralized price calculation (Phase 12 pricing redesign)

```sql
calculate_product_price(
  p_product_id UUID,
  p_region_id UUID,
  p_supplier_id UUID,
  p_user_role TEXT, -- 'b2b' or 'b2c'
  p_variation_ids UUID[]
)
```

**Returns:**
- supplier_price (base)
- variation_adjustment
- regional_multiplier
- commission_rate
- b2b_price, b2c_price, final_price

---

## Pricing Layers (Evolution)

### Phase 1-11: Simple Pricing
```
products.base_price
region_products.price (override per region)
```

### Phase 12: Multi-Supplier Pricing
```
supplier_products.price (lowest price wins)
region_products.price (legacy, being phased out)
```

### Current (2026-01-11): Pricing Redesign
```
supplier_products.price (source of truth)
+ pricing_config.commission_b2b/commission_b2c (platform fees)
+ regions.price_multiplier (regional adjustment)
+ product_variations.price_adjustment (variant pricing)
= final_price
```

**Migration Status:**
- New pricing system deployed (20260110200000_pricing_redesign_schema.sql)
- Legacy columns still present for backward compatibility
- Frontend still uses Phase 12 queries (supplier_products)

---

## Common Data Issues

### Issue #1: Product Exists But Not in Region

**Symptoms:**
- Admin shows product
- Website shows "Bu bölgede satılmamaktadır"

**Diagnosis Query:**
```sql
-- Find products without region assignment
SELECT p.id, p.name, p.category
FROM products p
WHERE p.is_active = true
  AND p.is_bugun_halde = true
  AND NOT EXISTS (
    SELECT 1 FROM region_products rp
    WHERE rp.product_id = p.id
      AND rp.region_id = '<YOUR_REGION_ID>'
      AND rp.is_active = true
  );
```

**Fix:**
```sql
-- Add product to region
INSERT INTO region_products (
  region_id, product_id, price, stock_quantity, is_active
)
VALUES (
  '<REGION_ID>',
  '<PRODUCT_ID>',
  <PRICE>,
  <STOCK>,
  true
);
```

---

### Issue #2: Region Inactive

**Symptoms:**
- All products show "Bölge aktif değil"

**Diagnosis Query:**
```sql
-- Check region status
SELECT id, name, slug, is_active
FROM regions
WHERE id = '<YOUR_REGION_ID>';
```

**Fix:**
```sql
-- Activate region
UPDATE regions SET is_active = true WHERE id = '<REGION_ID>';
```

---

### Issue #3: No Supplier for Product (Phase 12)

**Symptoms:**
- Product in region_products but no price
- `useBugunHaldeProducts()` returns empty

**Diagnosis Query:**
```sql
-- Find products without active suppliers
SELECT p.id, p.name
FROM products p
WHERE p.is_active = true
  AND p.is_bugun_halde = true
  AND NOT EXISTS (
    SELECT 1 FROM supplier_products sp
    WHERE sp.product_id = p.id
      AND sp.is_active = true
  );
```

**Fix:**
```sql
-- Add supplier product
INSERT INTO supplier_products (
  supplier_id, product_id, price, stock_quantity, is_active
)
VALUES (
  '<SUPPLIER_ID>',
  '<PRODUCT_ID>',
  <PRICE>,
  <STOCK>,
  true
);
```

---

## RLS Policy Impact

### Products Table
```sql
-- Anyone can view active products
POLICY: "Anyone can view active products"
USING: (is_active = true)
```
**Impact:** Non-authenticated users can see products

---

### Region Products Table
```sql
-- Anyone can view active region products
POLICY: "Anyone can view active region products"
USING: (is_active = true)
```
**Impact:** Controls which products show per region

---

### Supplier Products Table
```sql
-- Public can view active supplier products
POLICY: "Public can view active supplier products"
TO public, authenticated
USING: (is_active = true)
```
**Impact:** Phase 12 pricing requires supplier_products

---

## Diagnostic Queries

### Complete Product Visibility Check

```sql
-- Check if product is visible on frontend
WITH product_check AS (
  SELECT
    p.id,
    p.name,
    p.is_active as product_active,
    p.is_bugun_halde,
    -- Region assignment
    EXISTS(
      SELECT 1 FROM region_products rp
      WHERE rp.product_id = p.id
        AND rp.region_id = '<REGION_ID>'
        AND rp.is_active = true
    ) as in_region,
    -- Supplier assignment (Phase 12)
    EXISTS(
      SELECT 1 FROM supplier_products sp
      WHERE sp.product_id = p.id
        AND sp.is_active = true
    ) as has_supplier,
    -- Region active
    (SELECT is_active FROM regions WHERE id = '<REGION_ID>') as region_active
  FROM products p
  WHERE p.id = '<PRODUCT_ID>'
)
SELECT
  *,
  product_active
    AND in_region
    AND has_supplier
    AND COALESCE(region_active, true) as visible_on_frontend
FROM product_check;
```

### Region Product Inventory

```sql
-- All products for a region with status
SELECT
  p.id,
  p.name,
  p.category,
  p.is_bugun_halde,
  rp.price,
  rp.business_price,
  rp.stock_quantity,
  rp.availability,
  rp.is_active,
  sp.supplier_count
FROM products p
INNER JOIN region_products rp ON rp.product_id = p.id
LEFT JOIN (
  SELECT product_id, COUNT(*) as supplier_count
  FROM supplier_products
  WHERE is_active = true
  GROUP BY product_id
) sp ON sp.product_id = p.id
WHERE rp.region_id = '<REGION_ID>'
ORDER BY p.name;
```

### Missing Region Assignments

```sql
-- Products that should be in region but aren't
SELECT
  p.id,
  p.name,
  p.category,
  'Missing region_products entry' as issue
FROM products p
WHERE p.is_active = true
  AND p.is_bugun_halde = true
  AND NOT EXISTS (
    SELECT 1 FROM region_products rp
    WHERE rp.product_id = p.id
      AND rp.region_id = '<REGION_ID>'
  )
UNION ALL
-- Products in region but no supplier
SELECT
  p.id,
  p.name,
  p.category,
  'Missing supplier_products entry' as issue
FROM products p
INNER JOIN region_products rp ON rp.product_id = p.id
WHERE rp.region_id = '<REGION_ID>'
  AND NOT EXISTS (
    SELECT 1 FROM supplier_products sp
    WHERE sp.product_id = p.id
      AND sp.is_active = true
  );
```

---

## Frontend Query Flow

### Bugün Halde Page

```
1. useBugunHaldeProducts()
   └─> supplier_products (is_active=true)
       └─> products (is_active=true, is_bugun_halde=true)
   └─> Groups by product_id
   └─> Selects lowest price

2. useRegionProducts(regionId)
   └─> region_products (region_id=regionId, is_active=true)
       └─> products (is_bugun_halde=true)

3. mergeProductsWithRegion()
   └─> Left joins products with region_products
   └─> regionInfo = null if no match

4. sortByAvailability()
   └─> Products with regionInfo first
   └─> Out of stock last
   └─> Not in region at the end
```

---

## Resolution Steps

### Step 1: Identify Missing Data

Run the diagnostic queries to find:
1. Products without `region_products` entries
2. Products without `supplier_products` entries (Phase 12)
3. Inactive regions

### Step 2: Populate region_products

For each product that should be visible:
```sql
INSERT INTO region_products (
  region_id,
  product_id,
  price,
  business_price,
  stock_quantity,
  availability,
  is_active
) VALUES (
  '<REGION_ID>',
  '<PRODUCT_ID>',
  <PRICE>, -- or calculate from supplier_products
  <BUSINESS_PRICE>, -- nullable
  <STOCK_QUANTITY>,
  'plenty', -- or 'limited', 'last'
  true
);
```

### Step 3: Populate supplier_products (Phase 12)

For each product without supplier:
```sql
INSERT INTO supplier_products (
  supplier_id,
  product_id,
  price,
  stock_quantity,
  availability,
  is_active
) VALUES (
  '<SUPPLIER_ID>',
  '<PRODUCT_ID>',
  <PRICE>,
  <STOCK>,
  'plenty',
  true
);
```

### Step 4: Verify

```sql
-- Check product visibility
SELECT * FROM bugun_halde_comparison WHERE product_id = '<PRODUCT_ID>';

-- Check region assignment
SELECT * FROM region_products
WHERE product_id = '<PRODUCT_ID>' AND region_id = '<REGION_ID>';

-- Check supplier assignment
SELECT * FROM supplier_products
WHERE product_id = '<PRODUCT_ID>' AND is_active = true;
```

---

## Key Takeaways

1. **Product visibility requires 3 conditions:**
   - `products.is_active = true`
   - `region_products` entry exists for the region
   - `supplier_products` entry exists (Phase 12)

2. **Admin vs Frontend discrepancy:**
   - Admin queries `products` directly (shows all active)
   - Frontend requires `region_products` join (regional visibility)

3. **Region activation is critical:**
   - `regions.is_active = false` hides ALL products in that region
   - Check region status first when troubleshooting

4. **Phase 12 changed pricing source:**
   - Old: `products.base_price` + `region_products.price`
   - New: `supplier_products.price` (lowest wins)
   - Migration incomplete: both systems coexist

5. **Pricing redesign (2026-01-10):**
   - New `calculate_product_price()` RPC available
   - `pricing_config` table centralizes commission rates
   - `regions.price_multiplier` for regional adjustments
   - Frontend not yet migrated to new system
