# Stream 1.2: Schema Consistency Report

**Date:** 2026-01-08
**Analyst:** Database Architect
**Focus:** Phase 12 Multi-Supplier Architecture Schema Issues

---

## Executive Summary

**Schema Health Assessment: CRITICAL ISSUES FOUND**

The database schema contains **inconsistencies between table definitions and TypeScript types** that cause runtime errors. The primary issue is a **column name mismatch** between the actual database schema and the generated TypeScript types.

### Key Findings

| Issue | Severity | Impact |
|-------|----------|--------|
| `offered_price` column exists in wrong table definition | HIGH | Frontend queries fail with "column does not exist" |
| TypeScript types out of sync with database schema | HIGH | Type safety broken, runtime errors |
| `supplier_offers` table re-purposed without migration | HIGH | Data loss risk, breaking change |
| Phase 12 `supplier_products` table conflicts with legacy `supplier_offers` | MEDIUM | Architectural confusion |

---

## Critical Schema Issues

### 1. offered_price Column Mismatch

**Problem:**
- **Database Schema** (migration `20251226084618_99f108a1-bdf3-4630-ac85-5ff5e0b92ccf.sql`):
  - Table: `supplier_offers`
  - Column: `offered_price` (line 6)
  - Also has: `offered_quantity`, `status` (pending/approved/rejected)

- **TypeScript Types** (`src/integrations/supabase/types.ts` lines 613-670):
  - Table: `supplier_offers`
  - Columns: `unit_price`, `quantity`, `category`, `product_name`
  - **NO `offered_price` column exists in types!**

- **Frontend Code** (`src/hooks/useSupplierOffers.ts`):
  - Uses: `offered_price`, `offered_quantity` (lines 10-11, 27-28)
  - Queries: `.from('supplier_offers')`

**Root Cause:**
The `supplier_offers` table was **re-purposed** from a "product offer approval system" to a "supplier product catalog" without proper migration. The TypeScript types reflect the NEW schema, but the database has the OLD schema.

**Evidence:**
```sql
-- Database (OLD schema - still in use):
CREATE TABLE public.supplier_offers (
  offered_price numeric NOT NULL CHECK (offered_price > 0),
  offered_quantity integer NOT NULL CHECK (offered_quantity > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);
```

```typescript
// TypeScript (NEW schema - not in database):
supplier_offers: {
  Row: {
    unit_price: number  // <-- Different column name!
    quantity: number    // <-- Different column name!
    category: string    // <-- New column!
    product_name: string // <-- New column!
  }
}
```

---

## Complete Column Inventory

### Core Tables

#### `products` (Base Product Table)
```sql
id                  UUID PRIMARY KEY
name                TEXT
slug                TEXT
description         TEXT?
category            TEXT
unit                product_unit ENUM (kg, adet, demet, paket)
base_price          NUMERIC -- NOT offered_price!
previous_price      NUMERIC?
price_change        price_change ENUM (up, down, stable)
stock               INTEGER?
availability        availability_status ENUM?
quality             quality_grade ENUM?
origin              TEXT?
supplier_id         UUID? -- FK to suppliers (Phase 9)
images              TEXT[]?
variants            JSONB?
is_active           BOOLEAN
is_bugun_halde      BOOLEAN
product_status      TEXT? (active, inactive, out_of_stock)
last_modified_by    UUID?
last_modified_at    TIMESTAMPTZ?
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

**Status:** Mostly consistent with types
**Issue:** Column named `base_price`, not `price` or `offered_price`

---

#### `supplier_offers` (Legacy - Schema Mismatch!)
```sql
-- ACTUAL DATABASE SCHEMA (from migration 20251226084618):
id                UUID PRIMARY KEY
supplier_id       UUID -- FK to suppliers
product_id        UUID -- FK to products
offered_price     NUMERIC -- Column exists here!
offered_quantity  INTEGER
unit              TEXT DEFAULT 'kg'
notes             TEXT?
status            TEXT (pending, approved, rejected)
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ
UNIQUE(supplier_id, product_id, status)
```

**BUT TypeScript types show:**
```typescript
// types.ts lines 613-670
supplier_offers: {
  Row: {
    id: string
    supplier_id: string
    unit_price: number      // <-- MISMATCH!
    quantity: number        // <-- MISMATCH!
    category: string        // <-- NEW!
    product_name: string    // <-- NEW!
    unit: product_unit      // <-- ENUM vs TEXT
    quality_grade: quality_grade?
    status: string
    notes: string?
    admin_notes: string?    // <-- NEW!
    valid_until: string?    // <-- NEW!
    created_at: string
    updated_at: string
  }
}
```

**Status:** CRITICAL MISMATCH
**Impact:** Frontend queries using `offered_price` will fail

---

#### `supplier_products` (Phase 12 - New Table)
```sql
id                  UUID PRIMARY KEY
supplier_id         UUID -- FK to suppliers
product_id          UUID -- FK to products
price               NUMERIC -- NOT offered_price!
previous_price      NUMERIC?
price_change        price_change ENUM
stock_quantity      INTEGER
availability        availability_status ENUM
is_active           BOOLEAN
is_featured         BOOLEAN
quality             quality_grade ENUM
origin              TEXT
supplier_sku        TEXT?
min_order_quantity  INTEGER
delivery_days       INTEGER
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
last_price_update   TIMESTAMPTZ?
UNIQUE(supplier_id, product_id)
```

**Status:** Table exists, NOT in TypeScript types yet
**Issue:** TypeScript types don't include this table at all!

---

### Junction Tables

#### `product_variations` (Phase 12)
```sql
id              UUID PRIMARY KEY
product_id      UUID -- FK to products
variation_type  TEXT -- CHECK: size, type, scent, packaging, material, flavor, other
variation_value TEXT
display_order   INTEGER
metadata        JSONB
created_at      TIMESTAMPTZ
UNIQUE(product_id, variation_type, variation_value)
```

**Status:** Table exists, partially in types
**Issue:** Types file may need regeneration

---

#### `supplier_product_variations` (Phase 12)
```sql
id                       UUID PRIMARY KEY
supplier_product_id      UUID -- FK to supplier_products
variation_id             UUID -- FK to product_variations
supplier_variation_sku   TEXT?
price_adjustment         NUMERIC
stock_quantity           INTEGER
created_at               TIMESTAMPTZ
updated_at               TIMESTAMPTZ
UNIQUE(supplier_product_id, variation_id)
```

**Status:** Table exists, NOT in TypeScript types

---

## Foreign Key Constraints

| Constraint | From Table | From Column | To Table | To Column | On Delete | Status |
|------------|-----------|-------------|----------|-----------|-----------|--------|
| supplier_offers_supplier_id_fkey | supplier_offers | supplier_id | suppliers | id | CASCADE | OK |
| supplier_offers_product_id_fkey | supplier_offers | product_id | products | id | CASCADE | OK |
| products_supplier_id_fkey | products | supplier_id | suppliers | id | ? | CHECK NEEDED |
| supplier_products_supplier_id_fkey | supplier_products | supplier_id | suppliers | id | RESTRICT | OK |
| supplier_products_product_id_fkey | supplier_products | product_id | products | id | RESTRICT | OK |
| product_variations_product_id_fkey | product_variations | product_id | products | id | CASCADE | OK |
| supplier_product_variations_supplier_product_id_fkey | supplier_product_variations | supplier_product_id | supplier_products | id | CASCADE | OK |
| supplier_product_variations_variation_id_fkey | supplier_product_variations | variation_id | product_variations | id | CASCADE | OK |

---

## Migration Order Analysis

| Timestamp | Migration | Purpose | Dependencies | Status |
|------------|-----------|---------|--------------|--------|
| 20251226084618 | supplier_offers table | Create offer approval system | suppliers, products | DEPLOYED |
| 20250106000000 | Phase 9: Supplier Product Management | Add supplier_id to products | suppliers | DEPLOYED |
| 20250110000000 | Phase 12: Multi-Supplier | Create supplier_products | Phase 9, products | DEPLOYED |
| 20250110010000 | Phase 12 Data Migration | Migrate products->supplier_products | Phase 12 base | DEPLOYED |
| 20250110150000 | Product Variations | Create product_variations | Phase 12 | DEPLOYED |

**Issue:** No migration to RENAME `supplier_offers` columns to match new schema intent.

---

## Schema Mismatch Report

### Problem: supplier_offers Table Has Two Conflicting Definitions

**Definition A: Database Schema (Migration 20251226084618)**
```sql
CREATE TABLE public.supplier_offers (
  id uuid PRIMARY KEY,
  supplier_id uuid REFERENCES suppliers(id),
  product_id uuid REFERENCES products(id),
  offered_price numeric NOT NULL,  -- Column name: offered_price
  offered_quantity integer NOT NULL,
  unit text NOT NULL DEFAULT 'kg',
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz,
  updated_at timestamptz
);
```

**Definition B: TypeScript Types (types.ts lines 613-670)**
```typescript
supplier_offers: {
  Row: {
    id: string
    supplier_id: string
    unit_price: number       // <-- DIFFERENT!
    quantity: number         // <-- DIFFERENT!
    category: string         // <-- NEW COLUMN!
    product_name: string     // <-- NEW COLUMN!
    unit: product_unit       // <-- Different type (ENUM vs TEXT)!
    quality_grade: quality_grade | null  // <-- NEW COLUMN!
    status: string
    notes: string | null
    admin_notes: string | null  // <-- NEW COLUMN!
    valid_until: string | null   // <-- NEW COLUMN!
    created_at: string
    updated_at: string
  }
}
```

**Definition C: Frontend Usage (useSupplierOffers.ts)**
```typescript
interface SupplierOffer {
  offered_price: number;       // Uses Definition A
  offered_quantity: number;    // Uses Definition A
  status: 'pending' | 'approved' | 'rejected';
}

// Query fails because TypeScript expects Definition B but database has Definition A
const { data } = await supabase
  .from('supplier_offers')
  .select('offered_price');  // <-- Column doesn't exist per TypeScript!
```

---

### Root Cause Analysis

**What happened:**
1. **Phase 3/4:** `supplier_offers` table created for offer approval workflow
   - Columns: `offered_price`, `offered_quantity`, `status`
   - Purpose: Suppliers submit offers, admins approve

2. **Phase 12:** Multi-supplier architecture introduced
   - New table: `supplier_products` (proper junction table)
   - Purpose: Multiple suppliers per product

3. **Schema Confusion:**
   - Someone wanted to re-purpose `supplier_offers` for something else
   - TypeScript types were updated to reflect new schema
   - **BUT database was never migrated**
   - Frontend code still uses old column names

---

## SQL Fixes

### Fix 1: Regenerate TypeScript Types

```sql
-- This is NOT a SQL fix, but the FIRST step
-- Run Supabase type generation:

npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

---

### Fix 2: Decide on supplier_offers Purpose

**Option A: Keep supplier_offers for Approval Workflow**

```sql
-- Ensure types match database (current state is correct for this option)
-- Update frontend to use correct columns:

-- Frontend should use:
interface SupplierOffer {
  offered_price: number;
  offered_quantity: number;
  unit: string;  -- TEXT, not ENUM!
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
}

-- DO NOT use: unit_price, quantity, category, product_name
```

**Option B: Migrate supplier_offers to New Schema**

```sql
-- Step 1: Add new columns
ALTER TABLE public.supplier_offers
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS quality_grade quality_grade,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;

-- Step 2: Rename columns (BREAKING CHANGE - requires frontend update)
ALTER TABLE public.supplier_offers
RENAME COLUMN offered_price TO unit_price,
RENAME COLUMN offered_quantity TO quantity;

-- Step 3: Migrate data from products table
UPDATE public.supplier_offers so
SET
  category = p.category,
  product_name = p.name
FROM public.products p
WHERE so.product_id = p.id;

-- Step 4: Drop old constraint if needed
ALTER TABLE public.supplier_offers
DROP CONSTRAINT IF EXISTS supplier_offers_supplier_id_product_id_status_key;
```

**Option C: Deprecate supplier_offers, Use supplier_products**

```sql
-- Phase 12 already introduced supplier_products for proper multi-supplier
-- supplier_offers may be redundant

-- Step 1: Migrate data to supplier_products
INSERT INTO public.supplier_products (
  supplier_id,
  product_id,
  price,
  stock_quantity,
  availability,
  is_active,
  created_at,
  updated_at
)
SELECT
  supplier_id,
  product_id,
  offered_price,
  offered_quantity,
  CASE
    WHEN status = 'approved' THEN 'plenty'
    ELSE 'limited'
  END,
  status = 'approved',
  created_at,
  updated_at
FROM public.supplier_offers
WHERE status = 'approved'
ON CONFLICT (supplier_id, product_id) DO NOTHING;

-- Step 2: Archive old table (DO NOT DROP yet)
ALTER TABLE public.supplier_offers
RENAME TO supplier_offers_archive_20260108;

-- Step 3: Update frontend to use supplier_products instead
```

---

### Fix 3: Add Missing supplier_products to TypeScript

```sql
-- After regenerating types, verify supplier_products exists:
-- It should appear in types.ts as:

supplier_products: {
  Row: {
    id: string;
    supplier_id: string;
    product_id: string;
    price: number;
    previous_price: number | null;
    price_change: price_change | null;
    stock_quantity: number;
    availability: availability_status;
    is_active: boolean;
    is_featured: boolean;
    quality: quality_grade;
    origin: string;
    supplier_sku: string | null;
    min_order_quantity: number;
    delivery_days: number;
    created_at: string;
    updated_at: string;
    last_price_update: string | null;
  }
}
```

---

### Fix 4: Verify Consistency

```sql
-- Query to check which columns actually exist
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('supplier_offers', 'supplier_products', 'products')
ORDER BY table_name, ordinal_position;

-- Expected results:
-- supplier_offers: offered_price, offered_quantity (if not migrated)
-- supplier_products: price, stock_quantity
-- products: base_price, stock
```

---

## Verification Queries

### Test 1: Check Column Existence

```sql
-- Should return 1 if offered_price exists in supplier_offers
SELECT COUNT(*) as offered_price_exists
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'supplier_offers'
  AND column_name = 'offered_price';

-- Should return 1 if unit_price exists in supplier_offers
SELECT COUNT(*) as unit_price_exists
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'supplier_offers'
  AND column_name = 'unit_price';
```

---

### Test 2: Verify supplier_products Data

```sql
-- Check if migration succeeded
SELECT
  COUNT(*) as total_supplier_products,
  COUNT(DISTINCT supplier_id) as unique_suppliers,
  COUNT(DISTINCT product_id) as unique_products,
  AVG(price) as avg_price
FROM public.supplier_products
WHERE is_active = true;
```

---

### Test 3: Check for Orphan Products

```sql
-- Products with supplier_id but no supplier_products record
SELECT
  p.id,
  p.name,
  p.supplier_id,
  sp.id as supplier_product_id
FROM public.products p
LEFT JOIN public.supplier_products sp
  ON sp.product_id = p.id AND sp.supplier_id = p.supplier_id
WHERE p.supplier_id IS NOT NULL
  AND sp.id IS NULL;
```

---

### Test 4: Verify Foreign Key Constraints

```sql
-- Check for broken FKs
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('supplier_offers', 'supplier_products', 'product_variations');
```

---

## Frontend Code Fixes Required

### File: `src/hooks/useSupplierOffers.ts`

**Current (BROKEN):**
```typescript
interface SupplierOffer {
  offered_price: number;  // Column doesn't exist in TypeScript types
  offered_quantity: number;
}
```

**Fix Option A (Match Database):**
```typescript
interface SupplierOffer {
  offered_price: number;
  offered_quantity: number;
  unit: string;  // TEXT, not product_unit enum
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  product?: {
    id: string;
    name: string;
    unit: string;
  };
}
```

**Fix Option B (Use supplier_products Instead):**
```typescript
// Replace entire hook with useSupplierProducts hook
// supplier_products is the proper Phase 12 table
```

---

## Recommendations

### Immediate Actions (Priority 1)

1. **Regenerate TypeScript Types**
   ```bash
   npx supabase gen types typescript --project-id YOUR_ID > types.ts
   ```

2. **Decide on supplier_offers Purpose**
   - If approval workflow: Keep current schema, fix types
   - If catalog: Migrate to new schema
   - If redundant: Deprecate in favor of supplier_products

3. **Fix Frontend Queries**
   - Update `useSupplierOffers.ts` to match actual database columns
   - Or migrate to use `supplier_products` table

### Short-term Actions (Priority 2)

4. **Create Data Migration Script**
   - Migrate approved `supplier_offers` to `supplier_products`
   - Archive old `supplier_offers` table

5. **Update All References**
   - Search codebase for `offered_price` usage
   - Update to use correct column names

### Long-term Actions (Priority 3)

6. **Schema Migration Policy**
   - Never change schema without updating types
   - Always regenerate types after migration
   - Test frontend against new schema

7. **Deprecation Plan**
   - `supplier_offers` legacy table should be archived
   - Use `supplier_products` for all supplier-product relationships

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Frontend queries fail with column errors | HIGH | HIGH | Fix types or migrate schema |
| Data loss if table dropped without migration | MEDIUM | CRITICAL | Archive before dropping |
| User confusion if offers/products mixed | HIGH | MEDIUM | Clear separation of concerns |
| Performance issues with wrong indexes | LOW | MEDIUM | Review query patterns |

---

## Next Steps

1. **Choose Fix Strategy:** Option A, B, or C (see SQL Fixes above)
2. **Create Migration Script:** Based on chosen strategy
3. **Test on Staging:** Verify all queries work
4. **Deploy Migration:** Zero-downtime if possible
5. **Update Frontend:** Fix all references to mismatched columns
6. **Regenerate Types:** Ensure TypeScript matches database
7. **Monitor:** Check logs for column errors post-deployment

---

**Report Generated:** 2026-01-08
**Schema Version:** Phase 12 (Multi-Supplier)
**Status:** CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION
