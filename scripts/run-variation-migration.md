# Variation Type Migration Guide

**Migration:** `20260111010000_fix_variation_types.sql`
**Date:** 2026-01-11
**Goal:** Fix variation types for fresh food market, add 'quality' enum value

---

## What This Migration Does

1. **Creates backup table** `product_variations_backup_20260111`
2. **Cleans invalid data:** Deletes variations with invalid types (e.g., "beden") and "type: BEYAZ" entries
3. **Adds 'quality' enum value** for food quality grades (1. Sınıf, 2. Sınıf, Organik)
4. **Migrates data:**
   - `scent` → `quality`
   - `material` → `packaging`
   - `flavor` → `other`
   - `type` → `other`

---

## Execution Options

### Option 1: Supabase CLI (Recommended)

```bash
# From project root
npx supabase db push
```

**Pros:** Version controlled, can track execution status
**Cons:** Requires Supabase CLI setup

### Option 2: Supabase Dashboard SQL Editor

1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Copy entire migration file content
4. Paste and run

**Pros:** GUI interface, immediate feedback
**Cons:** No version tracking

---

## Migration Steps (In Order)

The migration runs in a single transaction. If any step fails, all changes roll back automatically.

```
STEP 1: Create backup table
STEP 2: Clean invalid data entries
STEP 3: Add 'quality' enum value
STEP 4: Migrate existing data to food-appropriate types
STEP 5: Update comments for food market context
STEP 6: Verify data integrity
```

---

## Before Running (Pre-Flight Checklist)

- [ ] **Backup verified:** Check you have recent database backup
- [ ] **Application stopped:** Prevent new data writes during migration
- [ ] **Read migration file:** Understand what changes will happen

---

## Verification Queries (Run After Migration)

### 1. Check backup was created

```sql
SELECT COUNT(*) AS backup_count
FROM product_variations_backup_20260111;
```

### 2. Check active variation types

```sql
SELECT variation_type, COUNT(*) as count
FROM product_variations
GROUP BY variation_type
ORDER BY count DESC;
```

### 3. Check for invalid types

```sql
SELECT variation_type, variation_value, product_id
FROM product_variations
WHERE variation_type::TEXT NOT IN ('size', 'packaging', 'quality', 'other');
```

Should return 0 rows.

### 4. Verify 'quality' enum exists

```sql
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'product_variation_type')
ORDER BY enumlabel;
```

Should include: `flavor`, `material`, `other`, `packaging`, `quality`, `scent`, `size`, `type`

---

## Rollback Procedure (If Something Goes Wrong)

**WARNING:** PostgreSQL ENUM values cannot be removed. The 'quality' value will remain even after rollback.

### Step-by-Step Rollback

```sql
BEGIN;

-- Restore from backup
TRUNCATE TABLE public.product_variations;
INSERT INTO public.product_variations
SELECT * FROM public.product_variations_backup_20260111;

-- Verify restoration
SELECT COUNT(*) FROM public.product_variations;

COMMIT;
```

### Clean Up (After Successful Migration)

```sql
-- Only run this AFTER confirming everything works
DROP TABLE IF EXISTS public.product_variations_backup_20260111;
```

---

## Expected Migration Output

When migration runs, you'll see these NOTICE messages:

```
NOTICE:  Backed up X product_variations records
NOTICE:  Pre-cleanup: X total, X invalid entries
NOTICE:  Deleted invalid records. Remaining: X
NOTICE:  Added quality enum value
NOTICE:  Migrated X scent entries to quality
NOTICE:  Migrated X material entries to packaging
NOTICE:  Migrated X flavor entries to other
NOTICE:  Migrated X type entries to other
NOTICE:  === Final Variation Type Summary ===
NOTICE:  Total variations: X
NOTICE:    size: X
NOTICE:    packaging: X
NOTICE:    quality: X
NOTICE:    other: X
NOTICE:    deprecated (should be 0): 0
```

---

## Post-Migration Tasks

1. **Restart application** to pick up new 'quality' type
2. **Update product forms** to use new variation types
3. **Test product pages** with variations
4. **Monitor logs** for any type-related errors
5. **Keep backup table** for at least 1 week before dropping

---

## Migration File Location

```
supabase/migrations/20260111010000_fix_variation_types.sql
```

---

## Troubleshooting

### Error: "enum value already exists"

The migration checks for this. If you see it, the 'quality' value was added before. This is safe to ignore.

### Error: "relation does not exist"

Check that you're in the correct schema (public). The migration uses `public.product_variations` explicitly.

### Lock timeout errors

Stop the application first, then retry the migration.

---

## Important Notes

1. **ENUM values persist:** Old values (type, scent, material, flavor) cannot be removed from PostgreSQL ENUM
2. **Application enforcement:** Your app should only use: `size`, `packaging`, `quality`, `other`
3. **Backup table:** Created as safety net, keep it for rollback
4. **Single transaction:** All-or-nothing execution

---

## Support

If issues occur:
1. Check the NOTICE messages for counts
2. Run verification queries
3. Use rollback procedure if needed
4. Check application logs for type-related errors
