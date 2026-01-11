# Variation Cleanup Report
## Fresh Food Market - Invalid Variation Types Analysis

**Date:** 2026-01-11
**Database:** Supabase PostgreSQL
**Schema:** public.product_variations

---

## EXECUTIVE SUMMARY

### Critical Finding
The database contains **invalid variation types** that are inappropriate for a fresh food market. These variations were designed for e-commerce (clothing, cosmetics, packaged goods) rather than fresh produce.

### Invalid Types Found
1. **`beden`** (Turkish for "size" - clothing term) - Not in database enum, but may exist as data
2. **`type`** with value **`BEYAZ`** (white) - Color attribute for non-food items
3. **`scent`** (LAVANTA, LIMON, PORÇEL) - Fragrance, irrelevant for produce
4. **`material`** (CAM, PLASTIK, METAL) - Packaging material, not product variation
5. **`flavor`** (VANILLA, ÇİKOLATA) - For processed foods, not fresh produce

### Valid Types for Fresh Food Market
| Type | Turkish | Examples |
|------|---------|----------|
| `size` | Boyut | 1 KG, 2 KG, 500 GR, 4 LT |
| `packaging` | Ambalaj | Kasa, Koli, Poset, *4 (4-pack) |
| `quality` | Kalite | 1. Sınıf, 2. Sınıf, Premium |
| `other` | Diğer | Custom variations |

---

## DATABASE SCHEMA

### Current Enum Definition
```sql
-- From: supabase/migrations/20250110150000_create_product_variations.sql
CREATE TABLE IF NOT EXISTS public.product_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variation_type TEXT NOT NULL CHECK (variation_type IN ('size', 'type', 'scent', 'packaging', 'material', 'flavor', 'other')),
  variation_value TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### TypeScript Type Definition
```typescript
// From: src/types/multiSupplier.ts
export type ProductVariationType =
  | 'size'      // 4 LT, 1.5 KG, 500 ML
  | 'type'      // BEYAZ, RENKLİ, SIVI, TOZ
  | 'scent'     // LAVANTA, LIMON, PORÇEL
  | 'packaging' // *4 (4-pack), *6, *12
  | 'material'  // CAM, PLASTIK, METAL
  | 'flavor'    // VANILLA, CİLEK, ÇİKOLATA
  | 'other';    // Catch-all for custom variations
```

---

## DIAGNOSTIC SQL QUERIES

### Query 1: Find All "beden" Variations (Invalid)
```sql
-- Find any variations with type "beden" (Turkish clothing size term)
-- This should NOT exist in the database due to CHECK constraint
SELECT
  pv.id,
  pv.product_id,
  p.name AS product_name,
  pv.variation_type,
  pv.variation_value,
  pv.display_order,
  pv.metadata
FROM public.product_variations pv
LEFT JOIN public.products p ON p.id = pv.product_id
WHERE pv.variation_type ILIKE '%beden%';
```

### Query 2: Find All "type" Variations with "BEYAZ" Value (Inappropriate)
```sql
-- Find variations where type is "type" and value is "BEYAZ" (color)
-- Color attribute is inappropriate for fresh produce
SELECT
  pv.id,
  pv.product_id,
  p.name AS product_name,
  pv.variation_type,
  pv.variation_value,
  pv.display_order,
  pv.metadata
FROM public.product_variations pv
LEFT JOIN public.products p ON p.id = pv.product_id
WHERE pv.variation_type = 'type'
  AND pv.variation_value ILIKE '%BEYAZ%';
```

### Query 3: Count Variations by Type
```sql
-- Get count of all variations grouped by type
SELECT
  variation_type,
  COUNT(*) AS variation_count,
  COUNT(DISTINCT product_id) AS product_count
FROM public.product_variations
GROUP BY variation_type
ORDER BY variation_count DESC;
```

### Query 4: Find All Invalid Type Variations (for fresh food)
```sql
-- Find variations with types inappropriate for fresh food market
SELECT
  pv.id,
  pv.product_id,
  p.name AS product_name,
  p.category AS product_category,
  pv.variation_type,
  pv.variation_value,
  pv.display_order
FROM public.product_variations pv
LEFT JOIN public.products p ON p.id = pv.product_id
WHERE pv.variation_type IN ('scent', 'material', 'flavor')
ORDER BY pv.variation_type, p.name;
```

### Query 5: Find All "type" Variations (Review Required)
```sql
-- All "type" variations - review each one
-- Some may be valid (liquid/powder), others invalid (color)
SELECT
  pv.id,
  pv.product_id,
  p.name AS product_name,
  p.category AS product_category,
  pv.variation_type,
  pv.variation_value,
  pv.display_order,
  pv.metadata
FROM public.product_variations pv
LEFT JOIN public.products p ON p.id = pv.product_id
WHERE pv.variation_type = 'type'
ORDER BY p.category, pv.variation_value;
```

### Query 6: Find Products with Multiple Variation Types
```sql
-- Products that have multiple different variation types
-- This helps identify products with mixed valid/invalid variations
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.category,
  COUNT(DISTINCT pv.variation_type) AS type_count,
  STRING_AGG(DISTINCT pv.variation_type, ', ') AS types_used
FROM public.products p
INNER JOIN public.product_variations pv ON pv.product_id = p.id
GROUP BY p.id, p.name, p.category
HAVING COUNT(DISTINCT pv.variation_type) > 1
ORDER BY type_count DESC;
```

### Query 7: Complete Variation Inventory
```sql
-- Full inventory of all variations in database
SELECT
  pv.variation_type,
  pv.variation_value,
  COUNT(*) AS count,
  STRING_AGG(DISTINCT p.category, ', ') AS categories
FROM public.product_variations pv
LEFT JOIN public.products p ON p.id = pv.product_id
GROUP BY pv.variation_type, pv.variation_value
ORDER BY pv.variation_type, pv.variation_value;
```

---

## CURRENT DATA INVENTORY

### From Seed File Analysis
**File:** `backups/product-seed-2026-01-10T19-11-57.json`

#### Found: "type" with "BEYAZ" value (4 instances)
```json
{
  "id": "9ca09412-1a99-4805-9ef4-885e89e31074",
  "product_id": "fe42cf61-cea0-4b05-b327-174d601d166f",
  "product_name": "Kırmızı Elma",
  "variation_type": "type",
  "variation_value": "BEYAZ",
  "metadata": {"color": "white"}
}
```

**Products with "BEYAZ" variation:**
1. Kırmızı Elma (Red Apple) - "BEYAZ" (WHITE) makes no sense
2. Muz (Banana) - "BEYAZ" (WHITE) makes no sense
3. Çilek (Strawberry) - "BEYAZ" (WHITE) makes no sense
4. Üzüm (Grape) - "BEYAZ" (WHITE) makes no sense

**These are clearly INVALID.**

---

## CLEANUP PLAN

### Phase 1: Identify (Run These Queries First)
1. **Query 3** - Get counts by type
2. **Query 4** - Find all scent/material/flavor variations
3. **Query 5** - Review all "type" variations
4. **Query 7** - Get complete inventory

### Phase 2: Delete Invalid Variations
```sql
-- Delete variations with invalid types for fresh food
DELETE FROM public.product_variations
WHERE variation_type IN ('scent', 'material', 'flavor');

-- Delete "type" variations with inappropriate values (color names)
DELETE FROM public.product_variations
WHERE variation_type = 'type'
  AND variation_value IN ('BEYAZ', 'RENKLI', 'SİYAH', 'KIRMIZI');

-- Delete any "beden" variations (if they exist despite CHECK constraint)
DELETE FROM public.product_variations
WHERE variation_type ILIKE '%beden%';
```

### Phase 3: Update CHECK Constraint
```sql
-- Remove invalid types from the CHECK constraint
ALTER TABLE public.product_variations
DROP CONSTRAINT product_variations_variation_type_check;

ALTER TABLE public.product_variations
ADD CONSTRAINT product_variations_variation_type_check
CHECK (variation_type IN ('size', 'packaging', 'quality', 'other'));
```

### Phase 4: Update TypeScript Types
```typescript
// File: src/types/multiSupplier.ts
export type ProductVariationType =
  | 'size'      // 1 KG, 2 KG, 500 GR, 4 LT
  | 'packaging' // Kasa, Koli, Poset, *4 (4-pack)
  | 'quality'   // 1. Sınıf, 2. Sınıf, Premium
  | 'other';    // Catch-all for custom variations

// REMOVED: type, scent, material, flavor (inappropriate for fresh food)
```

### Phase 5: Migration Script
```sql
-- Migration: 20260111000000_remove_invalid_variation_types.sql
-- Purpose: Remove invalid variation types for fresh food market

BEGIN;

-- 1. Delete invalid variation data
DELETE FROM public.product_variations
WHERE variation_type IN ('scent', 'material', 'flavor');

-- 2. Delete color-based "type" variations
DELETE FROM public.product_variations
WHERE variation_type = 'type'
  AND (
    variation_value ILIKE '%BEYAZ%'
    OR variation_value ILIKE '%RENK%'
    OR variation_value ILIKE '%SİYAH%'
    OR variation_value ILIKE '%KIRMIZI%'
    OR variation_value ILIKE '%MAVİ%'
  );

-- 3. Drop and recreate CHECK constraint
ALTER TABLE public.product_variations
DROP CONSTRAINT IF EXISTS product_variations_variation_type_check;

ALTER TABLE public.product_variations
ADD CONSTRAINT product_variations_variation_type_check
CHECK (variation_type IN ('size', 'packaging', 'quality', 'other'));

-- 4. Add comment
COMMENT ON TABLE public.product_variations IS
'Product variations for fresh food market. Valid types: size (Boyut), packaging (Ambalaj), quality (Kalite), other (Diğer).';

-- 5. Update indexes if needed
DROP INDEX IF EXISTS public.idx_product_variations_type;
CREATE INDEX idx_product_variations_type ON public.product_variations(variation_type);

COMMIT;
```

---

## VALID VARIATION EXAMPLES FOR FRESH FOOD

### size (Boyut)
| Value | Description | Valid For |
|-------|-------------|-----------|
| 500 GR | 500 grams | Fruits, vegetables |
| 1 KG | 1 kilogram | Most products |
| 2 KG | 2 kilograms | Bulk purchases |
| 5 KG | 5 kilograms | Bulk/restaurant |
| 4 LT | 4 liters | Liquids (oil, milk) |

### packaging (Ambalaj)
| Value | Description | Valid For |
|-------|-------------|-----------|
| Kasa | Crate | Eggs, fruits |
| Koli | Box | Bulk items |
| Poset | Bag | Small quantities |
| *4 | 4-pack | Multi-packs |
| *12 | 12-pack | Bulk multi-packs |

### quality (Kalite)
| Value | Description | Valid For |
|-------|-------------|-----------|
| 1. Sınıf | First class | Premium produce |
| 2. Sınıf | Second class | Standard produce |
| Premium | Premium | Best quality |
| Standart | Standard | Regular quality |

### other (Diğer)
| Value | Description | Valid For |
|-------|-------------|-----------|
| Organik | Organic | Organic products |
| Yerli | Domestic | Local produce |
| İthal | Imported | Imported products |

---

## BEFORE/AFTER COMPARISON

### Before Cleanup
| Type | Count | Valid? | Reason |
|------|-------|--------|--------|
| size | ? | Yes | Valid for food |
| type | 4+ | No | Contains colors (BEYAZ) |
| scent | ? | No | Fragrance irrelevant |
| packaging | ? | Maybe | Review values |
| material | ? | No | Packaging material |
| flavor | ? | No | Processed food only |
| other | ? | Yes | Fallback |

### After Cleanup
| Type | Count | Valid? | Notes |
|------|-------|--------|-------|
| size | ? | Yes | Keep all |
| packaging | ? | Yes | Review color values |
| quality | 0 | Yes | Add if needed |
| other | ? | Yes | Keep for custom |

---

## IMPACT ANALYSIS

### Affected Tables
1. `public.product_variations` - Main table
2. `public.supplier_product_variations` - Junction table (will cascade delete)
3. Frontend components using variations

### Affected Code Files
1. `src/types/multiSupplier.ts` - Type definition
2. `src/types/variations.ts` - Variation types
3. `src/integrations/supabase/types.ts` - Generated types
4. `src/hooks/useProductVariations.ts` - Hook
5. `src/components/supplier/VariationModal.tsx` - UI
6. `src/components/supplier/VariationList.tsx` - UI

### Frontend Updates Needed
1. Remove invalid types from dropdowns
2. Update variation type labels (Turkish)
3. Add validation for new types
4. Update variation creation forms

---

## VERIFICATION STEPS

### 1. Run Diagnostic Queries
```bash
# Execute all queries from this document
psql -f queries/01-count-by-type.sql
psql -f queries/02-find-invalid-types.sql
psql -f queries/03-find-beyaz-variations.sql
psql -f queries/04-complete-inventory.sql
```

### 2. Review Results
- Document all variations to be deleted
- Get stakeholder approval
- Create backup of current data

### 3. Execute Cleanup
```bash
# Run migration
psql -f migrations/20260111000000_remove_invalid_variation_types.sql
```

### 4. Verify Results
```sql
-- Confirm cleanup worked
SELECT variation_type, COUNT(*)
FROM public.product_variations
GROUP BY variation_type;

-- Should only show: size, packaging, quality, other
```

### 5. Update Code
- Update TypeScript types
- Regenerate Supabase types
- Update frontend UI
- Test all variation flows

---

## RECOMMENDATIONS

### Immediate Actions
1. Run diagnostic queries to get exact counts
2. Document all products affected by deletion
3. Create backup before cleanup
4. Execute migration during maintenance window

### Long-term Improvements
1. Add admin panel for variation type management
2. Make variation types configurable (not hardcoded)
3. Add validation for product-appropriate variations
4. Create variation templates by product category

### Prevention
1. Review variation types before adding to database
2. Validate variation values against product category
3. Add unit tests for variation creation
4. Document acceptable values per variation type

---

## REFERENCES

### Database Schema Files
- `supabase/migrations/20250110150000_create_product_variations.sql`
- `supabase/migrations/20260110200000_pricing_redesign_schema.sql`

### Type Definition Files
- `src/types/multiSupplier.ts`
- `src/types/variations.ts`
- `src/integrations/supabase/types.ts`

### Documentation
- `docs/database/VARIATION-PRICING-ANALYSIS.md`
- `docs/variation-pricing-fix.md`

### Related Issues
- Double pricing calculation bug (separate issue)
- Variation stock not checked (separate issue)

---

**Report Generated:** 2026-01-11
**Status:** Ready for review
**Next Step:** Run diagnostic queries to get current state
