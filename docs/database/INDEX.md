# Database Variation Cleanup - Query Index

**Purpose:** Diagnostic queries to identify and clean invalid variation types for fresh food market

---

## Query Files

| File | Purpose | When to Use |
|------|---------|-------------|
| `01-count-by-type.sql` | Count all variations by type | First query - get overview |
| `02-find-beyaz-variations.sql` | Find color-based "type" variations | Identify invalid color values |
| `03-find-invalid-types.sql` | Find scent/material/flavor variations | Identify completely invalid types |
| `04-find-all-type-variations.sql` | List all "type" variations | Review all type variations manually |
| `05-complete-inventory.sql` | Full variation inventory | Complete picture of all variations |
| `06-find-beden-variations.sql` | Find "beden" (clothing size) variations | Check for clothing terms |
| `07-products-mixed-variations.sql` | Products with mixed variation types | Identify complex products |

---

## Execution Order

### Step 1: Get Overview
```bash
psql -f docs/database/01-count-by-type.sql
```

**What it shows:**
- Total count per variation type
- Number of products using each type

### Step 2: Find Invalid Data
```bash
psql -f docs/database/02-find-beyaz-variations.sql
psql -f docs/database/03-find-invalid-types.sql
psql -f docs/database/06-find-beden-variations.sql
```

**What to look for:**
- "BEYAZ" or other color values (invalid for fresh produce)
- scent, material, flavor types (invalid for fresh food)
- "beden" (Turkish clothing size - very wrong)

### Step 3: Review All Type Variations
```bash
psql -f docs/database/04-find-all-type-variations.sql
```

**What to do:**
- Review each "type" variation manually
- Decide which are valid vs invalid
- Document findings

### Step 4: Get Complete Inventory
```bash
psql -f docs/database/05-complete-inventory.sql
```

**What it provides:**
- Complete list of all variation values
- Count per value
- Product categories using each value

### Step 5: Identify Complex Products
```bash
psql -f docs/database/07-products-mixed-variations.sql
```

**Why it matters:**
- Products with multiple variation types
- May need special handling during cleanup

---

## Invalid Types Summary

### Totally Invalid (Delete All)
| Type | Why Invalid | Example Values |
|------|-------------|----------------|
| `scent` | Fragrance irrelevant for produce | LAVANTA, LIMON, PORÇEL |
| `material` | Packaging material, not product variation | CAM, PLASTIK, METAL |
| `flavor` | For processed foods, not fresh produce | VANILLA, ÇİKOLATA |
| `beden` | Turkish clothing size term | S, M, L, XL |

### Partially Invalid (Review Values)
| Type | Valid Values | Invalid Values |
|------|--------------|----------------|
| `type` | SIVI, TOZ (for non-produce items) | BEYAZ, RENKLI (colors) |

### Valid for Fresh Food
| Type | Turkish | Examples |
|------|---------|----------|
| `size` | Boyut | 1 KG, 2 KG, 500 GR, 4 LT |
| `packaging` | Ambalaj | Kasa, Koli, Poset, *4 |
| `quality` | Kalite | 1. Sınıf, Premium, Standart |
| `other` | Diğer | Organik, Yerli, İthal |

---

## Cleanup Migration

After running diagnostic queries and reviewing results:

```bash
# Run the cleanup migration
psql -f supabase/migrations/20260111000000_remove_invalid_variation_types.sql
```

**What the migration does:**
1. Deletes scent, material, flavor variations
2. Deletes "type" variations with color values
3. Deletes all remaining "type" variations
4. Updates CHECK constraint to only allow: size, packaging, quality, other
5. Updates table/column comments
6. Recreates indexes

---

## Verification

After cleanup, verify results:

```sql
SELECT
  variation_type,
  COUNT(*) AS variation_count,
  COUNT(DISTINCT product_id) AS product_count
FROM public.product_variations
GROUP BY variation_type
ORDER BY variation_type;

-- Expected: Only size, packaging, quality, other
```

---

## Rollback (If Needed)

See rollback instructions in the migration file:

```sql
-- 1. Restore CHECK constraint
ALTER TABLE public.product_variations
DROP CONSTRAINT product_variations_variation_type_check;

ALTER TABLE public.product_variations
ADD CONSTRAINT product_variations_variation_type_check
CHECK (variation_type IN ('size', 'type', 'scent', 'packaging', 'material', 'flavor', 'other'));

-- 2. Restore data from backup
psql -f backups/product_variations_before_cleanup.sql
```

---

## Related Documentation

- `docs/variation-cleanup-report.md` - Full analysis and cleanup plan
- `docs/variation-pricing-fix.md` - Variation pricing system issues
- `docs/database/VARIATION-PRICING-ANALYSIS.md` - Pricing system deep dive

---

## Type Updates

After migration, update TypeScript types:

1. Replace `src/types/multiSupplier.ts` with `src/types/multiSupplier-cleaned.ts`
2. Regenerate Supabase types: `npx supabase gen types typescript`
3. Update frontend components to use new type labels
4. Remove invalid types from variation dropdowns

---

**Last Updated:** 2026-01-11
